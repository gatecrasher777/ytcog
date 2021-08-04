// ytcog - innertube library - video object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const sanitize = require("sanitize-filename");
const ut = require('./ut')();
const fork = require('child_process').fork;
const Model = require('./model');

class Video extends Model {
	
	constructor(session,options) { 
		super(session.cookie,session.userAgent);
		this.type = 'video';
		this.session = session;
		this.id = options.id;
		this.channel = '';
		this.duration = -1;
		this.expiry = 0;
		this.views = -1;
		this.rating = -1;
		this.updated = 0;
		this.published = options.published;
		this.downloaded = 0;
		this.canEmbed = true;
		this.isLive = false;
		this.title = '';
		this.category = '';
		this.description = '';
		this.author = '';
		this.channelThumb = '';
		this.country = '';
		this.fn = '';
		this.keywords = [];
		this.storyBoards = [];
		this.videoStreams = [];
		this.audioStreams = [];
		this.formats = [];
		this.child = null;
		this.options = {
			id: options.id,
			published: 0,
			path: '',
			filename: '',
			container: 'mkv',  
			videoQuality: '1080p', 
			audioQuality: 'medium', 
			mediaBitrate: 'highest',
			videoFormat: -1,
			audioFormat: -1,
			progress: (prg,siz)=>{}
		};
		this.updateOptions(options);
		this.cancelled = false;
	}

	#process() {
		this.updated = ut.now();
		try {
			let v = this.data.videoDetails;
			if (v.isLiveContent) this.isLive = v.isLiveContent;
			if (v.title) this.title = v.title;
			if (v.author) this.author = v.author;
			if (v.channelId) this.channel = v.channelId;
			if (v.shortDescription) this.description = v.shortDescription;
			if (v.averageRating) this.rating = v.averageRating;
			if (v.viewCount) this.views = parseInt(v.viewCount);
			if (v.lengthSeconds) this.duration = parseInt(v.lengthSeconds);
			if (v.keywords) this.keywords = v.keywords;
		} catch(e) {}
		try {
			let pm = this.data.microformat.playerMicroformatRenderer;
			if (this.published == 0) {
				if (pm.publishDate) {
					let s = pm.publishDate; 
					let p = new Date(parseInt(s.substr(0,4)),parseInt(s.substr(5,2))-1,parseInt(s.substr(8,2)),12);
					(p.valueOf()>ut.now()) ? this.published = ut.now() : this.published = p.valueOf();
				}
			}
			if (pm.category) this.category = pm.category;
		} catch(e) {}
		let havePreviews = false;
		try {
			let p = this.data.playabilityStatus;
			if (p.playableInEmbed) this.canEmbed = p.playableInEmbed;
		} catch(e) {}
		try {
			let sb = this.data.storyboards.playerStoryboardSpecRenderer.spec
			if (sb) {
				let s = sb.split('|');
				let url = s.shift();
				this.storyBoards = [];
				for (let i = 0; i<s.length; i++) {
					let ss = s[i].split('#');
					let b = {
						width: ss[0],
						height: ss[1],
						frames: ss[2],
						perRow: ss[3],
						perCol: ss[4],
						timing: ss[5],
						fn: ss[6],
						sig: '&sigh='+ss[7],
						num: 0,
						page: []
					}
					let nos = 0;
					while (nos<b.frames) {
						let f = Math.min(b.perRow*b.perCol,b.frames-nos);
						let w = b.width*b.perCol;
						let c = b.perCol;
						let r = b.perRow;
						let h = b.height*b.perRow;
						if (f < b.perCol) {
							c = f;
							w = b.width * c;
						}
						let nr = f / b.perCol;
						if (nr < b.perRow) {
							r = 1+Math.floor((f-1)/b.perCol);
							h = b.height * r;
						}
						let p = {
							link:  url.replace('$L',i.toString()).replace('$N',b.fn).replace('$M',(b.num).toString())+b.sig,
							frames: f,
							width: w,
							height: h,
							cols: c,
							rows: r,
							num: b.num
						}
						b.page.push(p);
						b.num++;
						nos += b.perRow*b.perCol;
					}
					this.storyBoards.push(b);
					havePreviews = true;
				}
			} 
				
		} catch(e) {}
		try {  
			let sb = this.data.storyboards.playerLiveStoryboardSpecRenderer.spec;
			if (sb) {
				let ss = sb.split('#');					
				let url = ss.shift();					
				this.storyBoards = [];
				let b = {
					width: ss[0],
					height: ss[1],						
					perRow: ss[2],
					perCol: ss[3],
					frames: -1,
					timing: 2000,
					fn: '',
					sig: '',
					num: 0,
					page: []
				}
				let f = b.perRow*b.perCol;
				let w = b.width*b.perCol;
				let c = b.perCol;
				let r = b.perRow;
				let h = b.height*b.perRow;
				let nr = f / b.perCol;
				let p = {
					link: url,
					frames: f,
					width: w,
					height: h,
					cols: c,
					rows: r,
					num: 0
				}
				b.page.push(p);
				this.storyBoards.push(b);
				havePreviews = true;
			}
		} catch(e) {}
		try {
			let ct = this.data.endscreen.endscreenRenderer.elements;
			ct.forEach((e,i,a)=>{
				let er = e.endscreenElementRenderer;
				if ((er.style == 'CHANNEL') && (er.endpoint.browseEndpoint.browseId == this.channel)) {
					let th = er.image.thumbnails[0];
					if (th.url) this.channelThumb = th.url;
				}
			});
		} catch(e) {}
		try {
			let th = this.data.author.thumbnails;
			let ln = th.length-1;
			if (th[ln].url) this.channelThumb = th[ln].url; 
		} catch(e) {}
		if (this.formats.length) {	
			try {
				let ds = this.data.streamingData;
				if (ds.expiresInSeconds) this.expiry = parseInt(ds.expiresInSeconds);
				this.videoStreams = [];
				this.audioStreams = [];
				this.formats.forEach((f,ndx,fmts)=>{
					if (f.contentLength === undefined) {
						f.contentLength = f.bitrate * parseInt(f.approxDurationMs) / 8000;
					}
					if (
						(
							(!f.url) 
							|| 
							(f.url.substr(0,23) != 'https://manifest.google')
						) 
						&& 
						(
							(f.type === undefined) 
							|| 
							(f.type != 'FORMAT_STREAM_TYPE_OTF')
						) 
						&&
						(f.contentLength) 
						&& 
						(f.bitrate) 
						&& 
						(f.mimeType)
					) {
						let stream;
						if (f.mimeType.includes('video')) {
							let type = 'video';
							let container = 'mp4';
							if (f.mimeType.includes('mp4a') || f.mimeType.includes('opus')) type = 'both';
							if (f.mimeType.includes('webm')) container = 'webm';
							if (f.mimeType.includes('3gp')) container = '3gp';
							if (f.mimeType.includes('flv')) container = 'flv';
							if (f.mimeType.includes('hls')) container = 'hls';
							stream = {
								quality: f.qualityLabel,
								container: container,
								bitrate: f.bitrate,
								size: parseInt(f.contentLength),
								type: type,
								url: f.url || f.signatureCipher || f.cipher,
								decipher: (!f.url)
							}
							this.session.player.adapt(stream);
							this.videoStreams.push(stream);
							if (type=='both') {
								let streamclone = ut.jp(ut.js(stream));
								streamclone.quality = f.audioQuality,
								this.audioStreams.push(streamclone);
							}
						} else {
							let container = 'mp4';
							if (f.mimeType.includes('opus')) container = 'webm';
							stream = {
								quality: f.audioQuality,
								container: container,
								bitrate: f.bitrate,
								size: parseInt(f.contentLength),
								type: 'audio',
								url: f.url || f.signatureCipher || f.cipher,
								decipher: (!f.url)
							}
							this.session.player.adapt(stream);
							this.audioStreams.push(stream);
						}
					}
				});
			} catch(e) {
				console.log(e);
			}
			this.#sortStreams();
		}
		
	}

	async fetch() {
		let postData = ut.js({
			playbackContext : {
				contentPlaybackContext: {
					"currentUrl": "/watch?v="+this.options.id,
					"vis": 0,
					"splay": false,
					"autoCaptionsDefaultOn": false,
					"autonavState": "STATE_OFF",
					"html5Preference": "HTML5_PREF_WANTS",
					"signatureTimestamp": this.session.sts,
					"referer": "https://www.youtube.com",
					"lactMilliseconds": "-1"
				}
			},
			context : this.session.context,
			videoId : this.options.id
		});
		let hdrs = {
			'content-type': 'application/json',
			'content-length': Buffer.byteLength(postData,'utf8'),
			'referer': 'https://www.youtube.com/watch?v='+this.options.id,
			'x-goog-authuser': '0',
			'x-goog-visitor-id': this.session.context.client.visitorData,
			'x-youtube-client-name': '1',
			'x-youtube-client-version': this.session.context.client.clientVersion,
			'x-origin': 'https://www.youtube.com'
		}
		if (this.session.loggedIn) hdrs['authorization'] = this.session.player.idhashFn(this.sapisid);
		let body = await this.httpsPost(
			'https://www.youtube.com/youtubei/v1/player?key='+this.session.key,
			{
				path: '/youtubei/v1/player?key='+this.session.key,
				headers: hdrs			
			},
			postData,
			true
		);
		if (body) {
			this.data = ut.jp(body);
            try{
				let sts;
				let sd;				
                sts = this.data.playabilityStatus;
                if (sts) {
					this.status = sts.status;
                    if (this.status != 'OK') { // other cases						
                        this.reason = sts.reason;
                        if (this.reason === undefined) {
                            if (sts.messages === undefined) {
                                this.reason = this.status;
                            } else {
                                this.reason = sts.messages[0];
                            }
                        }
                        this.status = 'ERROR';
                    } else { 
						sd = this.data.streamingData;
						this.formats = [];
						if (sd.formats) {
							sd.formats.forEach((e) => {
								this.formats.push(e);
							});
						}
						if (sd.adaptiveFormats) {
							sd.adaptiveFormats.forEach((e) => {
								this.formats.push(e);
							});
						}
                        this.reason = '';
                        this.#process();
                    }
                } else {					
                    this.item.status = 'ERROR';
                    this.item.meta.reason = 'Cannot get playability status';
                } 
            } catch(e) {
			}
        }
	}

	async imageOnline() {
		await this.httpsHead('https://i.ytimg.com/vi/'+this.item.id+'/hqdefault.jpg',{});
		if (this.status != 'OK') {
			if (this.reason.included('404')) {
				this.status = 'REMOVED'
				this.reason = 'This video is offline';
				return false;
			}
			return false;
		} 
		return true;
	}

	get hasMedia() {
		return ((this.videoStreams.length) || (this.audioStreams.length))
	}
	
	get streamInfo() {
		if (this.hasMedia) {
			this.#sortStreams();
			let si = {
				video: {},
				audio: {}
			}
			this.videoStreams.forEach((e,i,a)=>{
				si.video[i] = `${e.quality} ${ut.qFmt(e.bitrate)}bs ${e.container} (${ut.qFmt(e.size,'g')}b)`;
				if (e.type == 'both') si.video[i]+=' with audio';
			});
			this.audioStreams.forEach((e,i,a)=>{
				si.audio[i] = `${e.quality.replace('AUDIO_QUALITY_','')} ${ut.qFmt(e.bitrate)}bs ${e.container} (${ut.qFmt(e.size,'g')}b)`;
				if (e.type == 'both') si.audio[i]+=' with video';
			});
			return si;
		} else return {error:'No media available'}
	}

	get timeToExpiry() {
		if ((this.hasMedia) && (this.updated) && (this.expiry)) {
			return Math.floor(this.updated/1000+this.expiry-ut.now()/1000);
		} else {
			return 0;
		}
	}

	async #downloadInstance(vformat, aformat, vonly, aonly) { 
		try {
			let vs, as, uc, uq;
			let data = {
				id: this.options.id,
				dlpath: this.options.path,
				fn: this.options.path+'/'+sanitize(
					this.author.replace(/ - /g,' ~ ')+' - '+
					this.title.replace(/ - /g,' ~ ')+' - '+
					this.options.id
				),
				aformat: aformat,
				vformat: vformat
			}
			if (vonly && aonly) {
				return { 
					success: false, 
					fail: 'both'
				};
			} else if (vonly) {
				vs = this.videoStreams[vformat];
				uc = vs.container;
				uq = vs.quality;
				data.stream = {
					quality: uq,
					container: uc,
					video_url: vs.url,
					audio_url: '',
					size: vs.size,
					vsize: vs.size,
					asize: 0,
					mode: 'vonly'
				}
			} else if (aonly) {
				as = this.audioStreams[aformat];
				uc = as.container;
				uq = as.quality.replace('AUDIO_QUALITY_','').toLowerCase();
				data.stream = {
					quality: uq,
					container: uc,
					video_url: '',
					audio_url: as.url,
					size: as.size,
					vsize: 0,
					asize: as.size,
					mode: 'aonly'
				}
			} else {
				vs = this.videoStreams[vformat];
				if (vs.type == 'both') {					
					uc = vs.container;
					uq = vs.quality;
					data.stream = {
						quality: uq,
						container: uc,
						video_url: vs.url,
						audio_url: '',
						size: vs.size,
						vsize: vs.size,
						asize: -1,
						mode: 'vonly'
					}
				} else {
					as = this.audioStreams[aformat];
					uc = vs.container;
					if (as.container != vs.container) uc = 'mkv'; 
					uq = vs.quality;
					data.stream = {
						quality: uq,
						container: uc,
						video_url: vs.url,
						audio_url: as.url,
						size: vs.size+as.size,
						vsize: vs.size,
						asize: as.size,
						mode: 'v&a'
					}
				}
			}
			
			if (data.stream) {;
				data.fn += ' - '+uq+'.'+uc;
				if (this.options.filename.length) data.fn = this.options.path+'/'+sanitize(this.options.filename+'.'+uc)
				let downloadFork = new Promise( (resolve,reject) => {
					this.child = fork('./lib/dl.js',[],{silent:false});
					this.child.on('message', async (msg) => {
						switch(msg.msg) {
							case 'ready': 
								this.child.send({msg:'download', data:data}); 
							break;
							case 'completed':
								this.child.send({msg:'done'}); 
								resolve({
									success: true,
									fn: data.fn
								});
							case 'progress':
								this.options.progress(msg.prg,msg.siz);
							break;
							case 'cancelled':
							case 'failed':
								if ((msg.reason == 'timed out') && (msg.attempt<3)) {
									this.child.send({msg:'retry'});
								} else {
									this.child.send({msg:'done'});
									this.cancelled = false;
									resolve({
										success: false, 
										fail: msg.fail,
										reason: msg.reason
									});
								}
							case 'error':
							break;
							default:	
								reject(
									{
										success:false, 
										fail: 'both',
										reason: 'unknown error'
									}
								);	
							break;
						}
					});
					this.child.on('error',(error) =>{	
					});
				});

				return await downloadFork.then(
					(result)=>{
						return result;
					}
				).catch(
					(error)=>{
						return {
							success: false,
							fail: 'both',
							reason: error
						}
					}
				);

			} else {
				return {
					success: false,
					fail: 'both',
					reason: 'invalid data stream'
				}
			}
		} catch (e) {
			console.log(e);
			return {
				success: false,
				fail: 'both',
				reason: e
			}
		}
	}

	async #trydl(dl, vonly, aonly) {
		try{
			let okay = false;
			let vs = this.videoStreams;
			let as = this.audioStreams;
			if ((vonly) && (dl.v<vs.length) ) okay = true;
			if ((aonly) && (dl.a<as.length) ) okay = true;
			if ((!vonly) && (!aonly) && (dl.v<vs.length) ) {
				if (vs[dl.v].type == 'both') okay = true;
				if (dl.a<as.length) {
					if (vs[dl.v].container == as[dl.a].container) okay = true;
					if (this.options.container=='mkv') okay =true;
				}
			}
			let pprg = -1;
			if ((okay) && (!this.cancelled)) {
				let result = await this.#downloadInstance(
					dl.v,
					dl.a, 
					vonly,
					aonly
				);
				if (result.success) {
					this.fn = result.fn;
					this.downloaded = ut.now();
					this.options.progress(100);
					return true;
				} else {
					if (result.fail=='audio') {
						return await dl.achk();
					} else if (result.fail == 'video') {
						return await dl.vchk();
					} else {
						this.reason = result.reason;
						return false;
					}
				}
			} else { 
				return await dl.achk();
			}
		} catch(e) {
			console.log(e);
		}
	}
	
	#vsort = (a,b) => {
		switch (this.options.videoQuality) {
			case 'highest': 
				if (parseInt(a.quality)>parseInt(b.quality)) return -1;
				if (parseInt(a.quality)<parseInt(b.quality)) return 1;
			break; 
			case 'medium': {
				let wp = Math.sqrt(420);
				let ap = Math.sqrt(parseInt(a.quality));
				let bp = Math.sqrt(parseInt(b.quality));
				if (((ap-wp)**2)<((bp-wp)**2)) return -1; 
				if (((ap-wp)**2)>((bp-wp)**2)) return 1; 
			}
			break;
			case 'none':
			case 'lowest':
				if (parseInt(a.quality)<parseInt(b.quality)) return -1;
				if (parseInt(a.quality)>parseInt(b.quality)) return 1;
			break;
			default: {  
				if ((a.quality == this.options.videoQuality) && (b.quality != this.options.videoQuality)) return -1; 
				if ((a.quality != this.options.videoQuality) && (b.quality == this.options.videoQuality)) return 1;
				let wp = Math.sqrt(parseInt(this.options.videoQuality));
				let ap = Math.sqrt(parseInt(a.quality));
				let bp = Math.sqrt(parseInt(b.quality));
				if (((ap-wp)**2)<((bp-wp)**2)) return -1; 
				if (((ap-wp)**2)>((bp-wp)**2)) return 1;
			}
			break;
		} 
		if ((a.container==this.options.container) && (b.container!=this.options.container)) return -1;
		if ((a.container!=this.options.container) && (b.container==this.options.container)) return 1;
		if ((this.options.mediaBitrate=='highest') && (a.bitrate>b.bitrate)) return -1;
		if ((this.options.mediaBitrate=='highest') && (a.bitrate<b.bitrate)) return 1;
		if ((this.options.mediaBitrate=='lowest') && (a.bitrate<b.bitrate)) return -1;
		if ((this.options.mediaBitrate=='lowest') && (a.bitrate>b.bitrate)) return 1;
		return 0;
	}
	
	#asort(a,b) {
		switch (this.options.audioQuality) {
			case 'highest':
				if ((a.quality == 'AUDIO_QUALITY_HIGH') && (b.quality != 'AUDIO_QUALITY_HIGH')) return -1;
				if ((a.quality != 'AUDIO_QUALITY_HIGH') && (b.quality == 'AUDIO_QUALITY_HIGH')) return 1;
				if ((a.quality == 'AUDIO_QUALITY_MEDIUM') && (b.quality == 'AUDIO_QUALITY_LOW')) return -1;
				if ((a.quality == 'AUDIO_QUALITY_LOW') && (b.quality != 'AUDIO_QUALITY_LOW')) return 1;
			break; 
			case 'none':
			case 'medium':
				if ((a.quality == 'AUDIO_QUALITY_MEDIUM') && (b.quality != 'AUDIO_QUALITY_MEDIUM')) return -1;
				if ((a.quality != 'AUDIO_QUALITY_MEDIUM') && (b.quality == 'AUDIO_QUALITY_MEDIUM')) return 1;
			break;
			default:
				if ((a.quality == 'AUDIO_QUALITY_LOW') && (b.quality != 'AUDIO_QUALITY_LOW')) return -1;
				if ((a.quality != 'AUDIO_QUALITY_LOW') && (b.quality == 'AUDIO_QUALITY_LOW')) return 1;
				if ((a.quality == 'AUDIO_QUALITY_MEDIUM') && (b.quality == 'AUDIO_QUALITY_HIGH')) return -1;
				if ((a.quality == 'AUDIO_QUALITY_HIGH') && (b.quality != 'AUDIO_QUALITY_HIGH')) return 1;
			break;
		}
		if ((a.type != 'both') && (b.type == 'both')) return -1;
		if ((a.type == 'both') && (b.type != 'both')) return 1;
		if ((a.container==this.options.container) && (b.container!=this.options.container)) return -1;
		if ((a.container!=this.options.container) && (b.container==this.options.container)) return 1;
		if ((this.options.mediaBitrate=='highest') && (a.bitrate>b.bitrate)) return -1;
		if ((this.options.mediaBitrate=='highest') && (a.bitrate<b.bitrate)) return 1;
		if ((this.options.mediaBitrate=='lowest') && (a.bitrate<b.bitrate)) return -1;
		if ((this.options.mediaBitrate=='lowest') && (a.bitrate>b.bitrate)) return 1;
		return 0;
	}
	
	#sortStreams() {
		this.videoStreams.sort(this.#vsort.bind(this));
		this.audioStreams.sort(this.#asort.bind(this));
	}

	async #downloadAttempt(vonly, aonly, vformat, aformat) {
		
		this.#sortStreams();

		let dl = {
			v : 0, 
			a : 0, 
			mv : this.videoStreams.length,
			ma : this.audioStreams.length,
		}
	
		if (vformat>=0) {
			dl.v = parseInt(vformat);
			if (aonly) dl.v = 0;
		}
	
		if (aformat>=0) {
			dl.a = parseInt(aformat);
			if (vonly) dl.a = 0;
		}
	
		if ((dl.mv) || (dl.ma)) {
	
			dl.vchk = async function() {
				if (vformat>=0) {
					return false;
				} else {
					dl.v++;
					dl.a=0;
					if (dl.v >= dl.mv) {
						this.status = 'NOK';
						this.reason = 'all video streams are exhausted, download failed'
						return false;
					} else { 
						return await this.#trydl(dl,vonly,aonly); 
					}
				}
			}
			
			dl.achk = async function() { 
				if (aformat>=0) {
					return await dl.vchk();
				} else {
					dl.a++;
					if (dl.a >= dl.ma) { 
						return await dl.vchk();
					} else { 
						return await this.#trydl(dl,vonly,aonly);
					}
				}
			}
	
			let result = await this.#trydl(dl,vonly,aonly);
			return result;
		} else {
			this.status = 'NOK';
			this.reason = 'No video or audio streams, download failed'
			return false;
		}
	}
	
	async #dl(vformat, aformat) {
		try {
			let vonly = false;
			if (aformat>=0) {
				if (aformat >= this.audioStreams.length) {
					vonly = true;
					aformat = -1;
				}
			}
			if (this.options.audioQuality == 'none') vonly = true;
			let aonly = false;
			if (vformat>=0) {
				if (vformat >= this.videoStreams.length) {
					aonly = true;
					vformat = -1;
				}
			}    
			if (this.options.videoQuality == 'none') aonly = true;
			let success = await this.#downloadAttempt(vonly, aonly, vformat, aformat);
			if (success) {
				this.downloaded = ut.now();
			} else { 
				if (!this.cancelled) {
					//try video onloy
					if ((aformat>=0) && (!vonly) && (!aonly) && ((vformat>=0) || (aformat>=0))) {
						success = await this.#downloadAttempt(true, false, vformat, aformat);
						if (success) this.downloaded = ut.now();
					}
				}
			}
		} catch(e) {
			console.log(e);
		}
	}

	async download(options={}) {
		this.downloaded = 0;
		this.options = { ...this.options, ...options }
		if (this.hasMedia) await this.#dl(this.options.videoFormat,this.options.audioFormat);
	}

	cancel() {
		if (!this.cancelled) {
			this.cancelled = true;
			if (this.child !== null) this.child.send({msg:'cancel'});
		}
	}

}

module.exports=Video;
