// ytcog - innertube library - video object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut')();
const fork = require('child_process').fork;
const fs = require('fs');
const Path = require('path');
const Model = require('./model');
const Comment = require('./comment');

// video object retrieves video information and media, allows smart or direct downloads
class Video extends Model {
	// construct the video, requires an active session object and
	// options: {id[,published,path,filename,container,videoQuality,audioQuality,mediaBitrate]}
	constructor(session, options) {
		super(session.cookie, session.userAgent);
		if (session.common.agent) this.common.agent = session.common.agent;
		this.type = 'video';
		this.session = session;
		this.id = options.id;
		this.channelId = '';
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
		this.cfn = '';
		this.keywords = [];
		this.storyBoards = [];
		this.videoStreams = [];
		this.audioStreams = [];
		this.captions = [];
		this.defaultCaptions = 0;
		this.comments = [];
		this.results = [];
		this.commentCount = 0;
		this.videoQuality = '';
		this.audioCodec = '';
		this.videoCodec = '';
		this.formats = [];
		this.child = null;
		this.options = {
			id: options.id,
			published: 0,
			path: '.',
			filename: '${author}_${datetime}_${title}_${id}_${videoQuality}_${videoCodec}_${audioCodec}',
			container: 'mkv',
			videoQuality: '1080p',
			audioQuality: 'medium',
			mediaBitrate: 'highest',
			videoFormat: -1,
			audioFormat: -1,
			metadata: '',
			overwrite: 'no',
			subtitles: 'none',
			subtitleFormat: 'srt',
			progress: (prg, siz, tot) => [prg, siz, tot],
		};
		this.updateOptions(options);
		this.commentOptions = {
			order: 'top',
			replies: true,
			quantity: 20,
			filename: '${author}_${datetime}_${title}_${id}_comments',
		};
		this.commentData = [];
		this.commentPage = 0;
		this.commentOrder = 'top';
		this.commentMore = '';
		this.quantity = 0;
		this.cancelled = false;
	}

	// process the retrieved video information, extract media
	process() {
		this.updated = ut.now();
		try {
			let v = this.data.videoDetails;
			if (v.isLiveContent) this.isLive = v.isLiveContent;
			if (v.title) this.title = v.title;
			if (v.author) this.author = v.author;
			if (v.channelId) this.channelId = v.channelId;
			if (v.shortDescription) this.description = v.shortDescription;
			if (v.averageRating) this.rating = v.averageRating;
			if (v.viewCount) this.views = parseInt(v.viewCount);
			if (v.lengthSeconds) this.duration = parseInt(v.lengthSeconds);
			if (v.keywords) this.keywords = v.keywords;
		} catch (e) { this.debug(e); }
		try {
			let pm = this.data.microformat.playerMicroformatRenderer;
			if (this.published === 0) {
				if (pm.publishDate) {
					let s = pm.publishDate;
					let p = new Date(parseInt(s.substr(0, 4)), parseInt(s.substr(5, 2)) - 1, parseInt(s.substr(8, 2)), 12);
					p.valueOf() > ut.now() ? this.published = ut.now() : this.published = p.valueOf();
				}
			}
			if (pm.category) this.category = pm.category;
		} catch (e) { this.debug(e); }
		try {
			let p = this.data.playabilityStatus;
			if (p.playableInEmbed) this.canEmbed = p.playableInEmbed;
		} catch (e) { this.debug(e); }
		try {
			let cp = this.data.captions;
			if (cp) {
				let cr = cp.playerCaptionsTracklistRenderer;
				if (cr) {
					let ct = cr.captionTracks;
					if (ct) {
						this.captions = [];
						ct.forEach(caption => {
							let c = {
								url: caption.baseUrl,
								code: caption.languageCode,
								name: caption.name.simpleText,
							};
							let v = c.code.indexOf('-');
							if (v) c.code = c.code.substr(0, v);
							this.captions.push(c);
						});
					}
					let at = cr.audioTracks;
					if (at) {
						let at0 = at[0];
						if (at0 && at0.defaultCaptionTrackIndex) this.defaultCaptions = at0.defaultCaptionTrackIndex;
					}
				}
			}
		} catch (e) { this.debug(e); }
		try {
			let sb = this.data.storyboards.playerStoryboardSpecRenderer;
			if (sb) {
				sb = sb.spec;
				let s = sb.split('|');
				let url = s.shift();
				this.storyBoards = [];
				for (let i = 0; i < s.length; i++) {
					let ss = s[i].split('#');
					let b = {
						width: ss[0],
						height: ss[1],
						frames: ss[2],
						perRow: ss[3],
						perCol: ss[4],
						timing: ss[5],
						fn: ss[6],
						sig: `&sigh=${ss[7]}`,
						num: 0,
						page: [],
					};
					let nos = 0;
					while (nos < b.frames) {
						let f = Math.min(b.perRow * b.perCol, b.frames - nos);
						let w = b.width * b.perCol;
						let c = b.perCol;
						let r = b.perRow;
						let h = b.height * b.perRow;
						if (f < b.perCol) {
							c = f;
							w = b.width * c;
						}
						let nr = f / b.perCol;
						if (nr < b.perRow) {
							r = 1 + Math.floor((f - 1) / b.perCol);
							h = b.height * r;
						}
						let p = {
							link: url.replace('$L', i.toString()).replace('$N', b.fn).replace('$M', b.num.toString()) + b.sig,
							frames: f,
							width: w,
							height: h,
							cols: c,
							rows: r,
							num: b.num,
						};
						b.page.push(p);
						b.num++;
						nos += b.perRow * b.perCol;
					}
					this.storyBoards.push(b);
				}
			}
		} catch (e) { this.debug(e); }
		try {
			let sb = this.data.storyboards.playerLiveStoryboardSpecRenderer;
			if (sb) {
				sb = sb.spec;
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
					page: [],
				};
				let f = b.perRow * b.perCol;
				let w = b.width * b.perCol;
				let c = b.perCol;
				let r = b.perRow;
				let h = b.height * b.perRow;
				let p = {
					link: url,
					frames: f,
					width: w,
					height: h,
					cols: c,
					rows: r,
					num: 0,
				};
				b.page.push(p);
				this.storyBoards.push(b);
			}
		} catch (e) { this.debug(e); }
		if (this.formats.length) {
			try {
				let minpub = ut.now();
				let ds = this.data.streamingData;
				if (ds.expiresInSeconds) this.expiry = parseInt(ds.expiresInSeconds);
				this.videoStreams = [];
				this.audioStreams = [];
				this.formats.forEach(f => {
					let lm = Math.floor(parseInt(f.lastModified) / 1000);
					if (!isNaN(lm) && lm && (minpub > lm)) minpub = lm;
					if (f.contentLength === undefined) {
						f.contentLength = f.bitrate * parseInt(f.approxDurationMs) / 8000;
					}
					if (
						(
							!f.url ||
							(
								f.url.substr(0, 23) !== 'https://manifest.google'
							)
						) &&
						(
							(
								f.type === undefined
							) ||
							(
								f.type !== 'FORMAT_STREAM_TYPE_OTF'
							)
						) &&
						f.contentLength && f.bitrate && f.mimeType
					) {
						let stream;
						if (f.mimeType.includes('video')) {
							let type = 'video';
							let container = 'mp4';
							let codec = 'h264';
							if (f.mimeType.includes('mp4a') || f.mimeType.includes('opus')) type = 'both';
							if (f.mimeType.includes('webm')) {
								container = 'webm';
								codec = 'vp9';
							}
							if (f.mimeType.includes('3gp')) container = '3gp';
							if (f.mimeType.includes('flv')) container = 'flv';
							if (f.mimeType.includes('hls')) container = 'hls';
							stream = {
								mimeType: f.mimeType,
								codec: codec,
								quality: f.qualityLabel,
								container: container,
								bitrate: f.bitrate,
								size: parseInt(f.contentLength),
								type: type,
								url: f.url || f.signatureCipher || f.cipher,
								decipher: !f.url,
							};
							this.session.player.adapt(stream);
							this.videoStreams.push(stream);
							if (type === 'both') {
								let streamclone = { ...stream };
								streamclone.quality = f.audioQuality;
								streamclone.codec = streamclone.codec === 'h264' ?
									streamclone.codec = 'aac' :
									streamclone.codec = 'opus';
								this.audioStreams.push(streamclone);
							}
						} else {
							let container = 'mp4';
							let codec = 'aac';
							if (f.mimeType.includes('opus')) {
								container = 'webm';
								codec = 'opus';
							}
							stream = {
								mimeType: f.mimeType,
								codec: codec,
								quality: f.audioQuality,
								container: container,
								bitrate: f.bitrate,
								size: parseInt(f.contentLength),
								type: 'audio',
								url: f.url || f.signatureCipher || f.cipher,
								decipher: !f.url,
							};
							this.session.player.adapt(stream);
							this.audioStreams.push(stream);
						}
					}
				});
				this.published = minpub;
			} catch (e) { this.debug(e); }
			this.sortStreams();
		}
	}

	// fetch request
	async fetch(options) {
		if (options) this.updateOptions(options);
		let postData = ut.js({
			playbackContext: {
				contentPlaybackContext: {
					currentUrl: `/watch?v=${this.options.id}`,
					vis: 0,
					splay: false,
					autoCaptionsDefaultOn: false,
					autonavState: 'STATE_OFF',
					html5Preference: 'HTML5_PREF_WANTS',
					signatureTimestamp: this.session.sts,
					referer: 'https://www.youtube.com',
					lactMilliseconds: '-1',
				},
			},
			context: this.session.context,
			videoId: this.options.id,
		});
		let hdrs = {
			'content-type': 'application/json',
			'content-length': Buffer.byteLength(postData, 'utf8'),
			referer: `https://www.youtube.com/watch?v=${this.options.id}`,
			'x-goog-authuser': '0',
			'x-goog-visitor-id': this.session.context.client.visitorData,
			'x-youtube-client-name': '1',
			'x-youtube-client-version': this.session.context.client.clientVersion,
			'x-origin': 'https://www.youtube.com',
		};
		if (this.session.loggedIn) hdrs.authorization = this.session.player.idhashFn(this.sapisid);
		let body = await this.httpsPost(
			`https://www.youtube.com/youtubei/v1/player?key=${this.session.key}`,
			{
				path: `/youtubei/v1/player?key=${this.session.key}`,
				headers: hdrs,
			},
			postData,
			true,
		);
		if (body) {
			this.data = ut.jp(body);
			try {
				let sts;
				let sd;
				sts = this.data.playabilityStatus;
				if (sts) {
					this.status = sts.status;
					if (this.status !== 'OK') {
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
							sd.formats.forEach(e => {
								this.formats.push(e);
							});
						}
						if (sd.adaptiveFormats) {
							sd.adaptiveFormats.forEach(e => {
								this.formats.push(e);
							});
						}
						this.reason = '';
						this.process();
					}
				} else {
					this.status = 'ERROR';
					this.reason = 'Cannot get playability status';
				}
			} catch (e) { this.debug(e); }
		}
	}

	// check online status of the default preview image. Check video.status after call.
	async imageOnline() {
		await this.httpsHead(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`);
	}

	// whether media has been retrieved
	get hasMedia() {
		return this.videoStreams.length || this.audioStreams.length;
	}

	// whether media has captions
	get hasCaptions() {
		return this.captions.length;
	}

	// user friendly summary object listing video and audio streams available.
	get streamInfo() {
		if (this.hasMedia) {
			this.sortStreams();
			let si = {
				video: {},
				audio: {},
			};
			this.videoStreams.forEach((e, i) => {
				si.video[i] = `${e.quality} ${ut.qFmt(e.bitrate)}bs ${e.container} ${e.codec} (${ut.qFmt(e.size, 'g')}b)`;
				if (e.type === 'both') si.video[i] += ' with audio';
			});
			this.audioStreams.forEach((e, i) => {
				si.audio[i] = `${e.quality.replace('AUDIO_QUALITY_',
					'')} ${ut.qFmt(e.bitrate)}bs ${e.container} ${e.codec} (${ut.qFmt(e.size, 'g')}b)`;
				if (e.type === 'both') si.audio[i] += ' with video';
			});
			return si;
		} else { return { error: 'No media available' }; }
	}

	// Number of seconds before the streams expire.
	get timeToExpiry() {
		if (this.hasMedia && this.updated && this.expiry) {
			return Math.floor((this.updated / 1000) + this.expiry - (ut.now() / 1000));
		} else {
			return 0;
		}
	}

	// Downloads a specific audio/video combination
	async downloadInstance(vformat, aformat, vonly, aonly) {
		try {
			let vs, as, uc, uac, uq;
			this.videoQuality = '';
			this.audioCodec = '';
			this.videoCodec = '';
			let data = {
				id: this.options.id,
				dlpath: this.options.path,
				fn: '',
				aformat: aformat,
				vformat: vformat,
				agent: this.userAgent,
				proxy: this.session.proxy,
				metadata: [],
			};
			if (vonly && aonly) {
				return {
					success: false,
					fail: 'both',
				};
			} else if (vonly) {
				vs = this.videoStreams[vformat];
				uc = uac = vs.container;
				this.videoCodec = uc === 'webm' ? 'vp9' : 'h264';
				uq = this.videoQuality = vs.quality;
				data.stream = {
					quality: uq,
					container: uc,
					acontainer: uc,
					video_url: vs.url,
					audio_url: '',
					size: vs.size,
					vsize: vs.size,
					asize: 0,
					mode: 'vonly',
				};
			} else if (aonly) {
				as = this.audioStreams[aformat];
				uc = as.container;
				uac = this.options.container;
				this.audioCodec = uc === 'webm' ? 'opus' : 'aac';
				['mp3', 'flac'].includes(uac) ? this.audioCodec = uac : uac = this.audioCodec;
				uq = as.quality.replace('AUDIO_QUALITY_', '').toLowerCase();
				data.stream = {
					quality: uq,
					container: uc,
					acontainer: uac,
					video_url: '',
					audio_url: as.url,
					size: as.size,
					vsize: 0,
					asize: as.size,
					mode: 'aonly',
				};
				uc = this.audioCodec;
			} else {
				vs = this.videoStreams[vformat];
				if (vs.type === 'both') {
					uc = vs.container;
					this.videoCodec = uc === 'webm' ? 'vp9' : 'h264';
					this.audioCodec = uc === 'webm' ? 'opus' : 'aac';
					uq = this.videoQuality = vs.quality;
					data.stream = {
						quality: uq,
						container: uc,
						acontainer: uc,
						video_url: vs.url,
						audio_url: '',
						size: vs.size,
						vsize: vs.size,
						asize: -1,
						mode: 'both',
					};
				} else {
					as = this.audioStreams[aformat];
					uc = vs.container;
					this.videoCodec = uc === 'webm' ? 'vp9' : 'h264';
					this.audioCodec = as.container === 'webm' ? 'opus' : 'aac';
					if (as.container !== vs.container) uc = 'mkv';
					uq = this.videoQuality = vs.quality;
					data.stream = {
						quality: uq,
						container: uc,
						acontiner: uc,
						video_url: vs.url,
						audio_url: as.url,
						size: vs.size + as.size,
						vsize: vs.size,
						asize: as.size,
						mode: 'v&a',
					};
				}
			}

			if (data.stream) {
				let md = this.options.metadata.split(',');
				md.forEach(s => {
					let z = s.split('=');
					let f; let v;
					switch (z[0]) {
						case 'author':
							f = uc === 'mp4' ? 'artist' : 'AUTHOR';
							v = z.length > 1 ? z[1] : this.author;
							break;
						case 'title':
							f = uc === 'mp4' ? 'title' : 'TITLE';
							v = z.length > 1 ? z[1] : this.title;
							break;
						case 'description':
							f = uc === 'mp4' ? 'description' : 'DESCRIPTION';
							v = z.length > 1 ? z[1] : this.description;
							break;
						case 'keywords':
							f = uc === 'mp4' ? 'synopsis' : 'KEYWORDS';
							v = z.length > 1 ? z[1] : this.keywords.join(',');
							break;
						case 'published':
							f = uc === 'mp4' ? 'date' : 'DATE';
							v = z.length > 1 ? z[1] : ut.ts2date(this.published);
							break;
						default:
							f = uc === 'mp4' ? z[0] : z[0].toUpperCase();
							v = z.length > 1 ? this.filename(z[1]) : 'none';
							break;
					}
					data.metadata.push({ field: f, value: v });
				});
				data.fn = `${this.options.path}/${this.filename(this.options.filename)}.${uc}`;
				if ((this.options.overwrite === 'no') && fs.existsSync(data.fn)) {
					return {
						success: true,
						fn: data.fn,
						total: 0,
					};
				} else {
					let downloadFork = new Promise((resolve, reject) => {
						this.child = fork(`${__dirname}/dl.js`, [], { silent: false });
						this.child.on('message', msg => {
							switch (msg.msg) {
								case 'ready':
									this.child.send({ msg: 'download', data: data });
									break;
								case 'completed':
									this.child.send({ msg: 'done' });
									resolve({
										success: true,
										fn: data.fn,
										total: data.stream.size,
									});
									break;
								case 'progress':
									if (!isNaN(msg.siz)) this.transferred += msg.siz;
									this.options.progress(msg.prg, msg.siz, msg.tot);
									break;
								case 'cancelled':
								case 'failed':
									if ((msg.reason === 'timed out') && (msg.attempt < 3)) {
										this.child.send({ msg: 'retry' });
									} else {
										this.child.send({ msg: 'done' });
										this.cancelled = false;
										resolve({
											success: false,
											fail: msg.fail,
											reason: msg.reason,
										});
									}
									break;
								case 'error':
									break;
								default:
									reject(
										{
											success: false,
											fail: 'both',
											reason: 'unknown error',
										},
									);
									break;
							}
						});
					});

					return await downloadFork.then(
						result => result,
					).catch(
						error => {
							this.debug(error);
							return {
								success: false,
								fail: 'both',
								reason: error,
							};
						},
					);
				}
			} else {
				return {
					success: false,
					fail: 'both',
					reason: 'invalid data stream',
				};
			}
		} catch (e) {
			this.debug(e);
			return {
				success: false,
				fail: 'both',
				reason: e,
			};
		}
	}

	// Initiates a download instance
	async trydl(dl, vonly, aonly) {
		try {
			let okay = false;
			let vs = this.videoStreams;
			let as = this.audioStreams;
			if (vonly && (dl.v < vs.length)) okay = true;
			if (aonly && (dl.a < as.length)) okay = true;
			if (!vonly && !aonly && (dl.v < vs.length)) {
				if (vs[dl.v].type === 'both') okay = true;
				if (dl.a < as.length) {
					if (vs[dl.v].container === as[dl.a].container) okay = true;
					if (this.options.container === 'mkv') okay = true;
				}
			}
			if (okay && !this.cancelled) {
				let result = await this.downloadInstance(
					dl.v,
					dl.a,
					vonly,
					aonly,
				);
				if (result.success) {
					this.fn = result.fn;
					this.downloaded = ut.now();
					this.options.progress(100, 0, result.total);
					return true;
				} else if (result.fail === 'audio') {
					return await dl.achk();
				} else if (result.fail === 'video') {
					return await dl.vchk();
				} else {
					this.reason = result.reason;
					return false;
				}
			} else {
				return await dl.achk();
			}
		} catch (e) { this.debug(e); }
	}

	// video sort algorithm
	vsort(a, b) {
		switch (this.options.videoQuality) {
			case 'highest':
				if (parseInt(a.quality) > parseInt(b.quality)) return -1;
				if (parseInt(a.quality) < parseInt(b.quality)) return 1;
				break;
			case 'medium': {
				let wp = Math.sqrt(420);
				let ap = Math.sqrt(parseInt(a.quality));
				let bp = Math.sqrt(parseInt(b.quality));
				if (((ap - wp) ** 2) < ((bp - wp) ** 2)) return -1;
				if (((ap - wp) ** 2) > ((bp - wp) ** 2)) return 1;
			}
				break;
			case 'none':
			case 'lowest':
				if (parseInt(a.quality) < parseInt(b.quality)) return -1;
				if (parseInt(a.quality) > parseInt(b.quality)) return 1;
				break;
			default: {
				if ((a.quality === this.options.videoQuality) && (b.quality !== this.options.videoQuality)) return -1;
				if ((a.quality !== this.options.videoQuality) && (b.quality === this.options.videoQuality)) return 1;
				let wp = Math.sqrt(parseInt(this.options.videoQuality));
				let ap = Math.sqrt(parseInt(a.quality));
				let bp = Math.sqrt(parseInt(b.quality));
				if (((ap - wp) ** 2) < ((bp - wp) ** 2)) return -1;
				if (((ap - wp) ** 2) > ((bp - wp) ** 2)) return 1;
			}
				break;
		}
		if ((a.container === this.options.container) && (b.container !== this.options.container)) return -1;
		if ((a.container !== this.options.container) && (b.container === this.options.container)) return 1;
		if ((this.options.mediaBitrate === 'highest') && (a.bitrate > b.bitrate)) return -1;
		if ((this.options.mediaBitrate === 'highest') && (a.bitrate < b.bitrate)) return 1;
		if ((this.options.mediaBitrate === 'lowest') && (a.bitrate < b.bitrate)) return -1;
		if ((this.options.mediaBitrate === 'lowest') && (a.bitrate > b.bitrate)) return 1;
		return 0;
	}

	// audio sort algorithm
	asort(a, b) {
		switch (this.options.audioQuality) {
			case 'highest':
				if ((a.quality === 'AUDIO_QUALITY_HIGH') && (b.quality !== 'AUDIO_QUALITY_HIGH')) return -1;
				if ((a.quality !== 'AUDIO_QUALITY_HIGH') && (b.quality === 'AUDIO_QUALITY_HIGH')) return 1;
				if ((a.quality === 'AUDIO_QUALITY_MEDIUM') && (b.quality === 'AUDIO_QUALITY_LOW')) return -1;
				if ((a.quality === 'AUDIO_QUALITY_LOW') && (b.quality !== 'AUDIO_QUALITY_LOW')) return 1;
				break;
			case 'none':
			case 'medium':
				if ((a.quality === 'AUDIO_QUALITY_MEDIUM') && (b.quality !== 'AUDIO_QUALITY_MEDIUM')) return -1;
				if ((a.quality !== 'AUDIO_QUALITY_MEDIUM') && (b.quality === 'AUDIO_QUALITY_MEDIUM')) return 1;
				break;
			default:
				if ((a.quality === 'AUDIO_QUALITY_LOW') && (b.quality !== 'AUDIO_QUALITY_LOW')) return -1;
				if ((a.quality !== 'AUDIO_QUALITY_LOW') && (b.quality === 'AUDIO_QUALITY_LOW')) return 1;
				if ((a.quality === 'AUDIO_QUALITY_MEDIUM') && (b.quality === 'AUDIO_QUALITY_HIGH')) return -1;
				if ((a.quality === 'AUDIO_QUALITY_HIGH') && (b.quality !== 'AUDIO_QUALITY_HIGH')) return 1;
				break;
		}
		if ((a.type !== 'both') && (b.type === 'both')) return -1;
		if ((a.type === 'both') && (b.type !== 'both')) return 1;
		if ((a.container === this.options.container) && (b.container !== this.options.container)) return -1;
		if ((a.container !== this.options.container) && (b.container === this.options.container)) return 1;
		if ((this.options.mediaBitrate === 'highest') && (a.bitrate > b.bitrate)) return -1;
		if ((this.options.mediaBitrate === 'highest') && (a.bitrate < b.bitrate)) return 1;
		if ((this.options.mediaBitrate === 'lowest') && (a.bitrate < b.bitrate)) return -1;
		if ((this.options.mediaBitrate === 'lowest') && (a.bitrate > b.bitrate)) return 1;
		return 0;
	}

	// sort media streams based on user preferences.
	sortStreams() {
		this.videoStreams.sort(this.vsort.bind(this));
		this.audioStreams.sort(this.asort.bind(this));
	}

	// falls back to less prefered streams if preferred streams fail, unless unique streams are specified
	async downloadAttempt(vonly, aonly, vformat, aformat) {
		this.sortStreams();

		let dl = {
			v: 0,
			a: 0,
			mv: this.videoStreams.length,
			ma: this.audioStreams.length,
		};

		if (vformat >= 0) {
			dl.v = parseInt(vformat);
			if (aonly) dl.v = 0;
		}

		if (aformat >= 0) {
			dl.a = parseInt(aformat);
			if (vonly) dl.a = 0;
		}

		if (dl.mv || dl.ma) {
			dl.vchk = () => {
				if (vformat >= 0) {
					return false;
				} else {
					dl.v++;
					dl.a = 0;
					if (dl.v >= dl.mv) {
						this.status = 'NOK';
						this.reason = 'all video streams are exhausted, download failed';
						return false;
					} else {
						return this.trydl(dl, vonly, aonly);
					}
				}
			};

			dl.achk = () => {
				if (aformat >= 0) {
					return dl.vchk();
				} else {
					dl.a++;
					if (dl.a >= dl.ma) {
						return dl.vchk();
					} else {
						return this.trydl(dl, vonly, aonly);
					}
				}
			};
			let result = await this.trydl(dl, vonly, aonly);
			return result;
		} else {
			this.status = 'NOK';
			this.reason = 'No video or audio streams, download failed';
			return false;
		}
	}

	// download wrapper
	async dl(vformat, aformat) {
		try {
			let vonly = false;
			if (aformat >= 0) {
				if (aformat >= this.audioStreams.length) {
					vonly = true;
					aformat = -1;
				}
			}
			if (this.options.audioQuality === 'none') vonly = true;
			let aonly = false;
			if (vformat >= 0) {
				if (vformat >= this.videoStreams.length) {
					aonly = true;
					vformat = -1;
				}
			}
			if (this.options.videoQuality === 'none') aonly = true;
			let success = await this.downloadAttempt(vonly, aonly, vformat, aformat);
			if (success) {
				this.downloaded = ut.now();
			} else if (!this.cancelled) {
				// try video onloy
				if ((aformat >= 0) && !vonly && !aonly && ((vformat >= 0) || (aformat >= 0))) {
					success = await this.downloadAttempt(true, false, vformat, aformat);
					if (success) this.downloaded = ut.now();
				}
			}
		} catch (e) { this.debug(e); }
	}

	// make an .srt subtitle file
	async makeSRT(url, code, translate) {
		let src = new URL(url);
		src.searchParams.set('fmt', 'json3');
		if (translate) src.searchParams.set('tlang', code);
		let body = await this.httpsGet(
			src.toString(),
			{
				path: src.pathname + src.search,
				headers: {
					'content-type': 'application/json',
					referer: `https://www.youtube.com/watch?v=${this.options.id}`,
				},
			},
			true,
		);
		if (body) {
			fs.writeFileSync('tempsrt', body, 'utf8');
			let result = ut.jp(body);
			let pfn = Path.parse(this.fn);
			pfn.base = '';
			pfn.ext = `.${code}.srt`;
			let str = '';
			let c = 0;
			result.events.forEach(evt => {
				if (evt.segs) {
					c++;
					let start = parseInt(evt.tStartMs);
					let end = start + parseInt(evt.dDurationMs);
					let text = '';
					evt.segs.forEach(seg => {
						text += `${seg.utf8}\n`;
					});
					str += `${c.toString()}\n`;
					str += `${ut.ms2tc(start)} ---> ${ut.ms2tc(end)}\n`;
					str += `${text}\n`;
				}
			});
			fs.writeFileSync(Path.format(pfn), str, 'utf8');
		}
	}

	async makeSubtitleFmt(fmt, url, code, translate) {
		let src = new URL(url);
		src.searchParams.set('fmt', fmt);
		if (translate) src.searchParams.set('tlang', code);
		let body = await this.httpsGet(
			src.toString(),
			{
				path: src.pathname + src.search,
				headers: {
					'content-type': 'application/json',
					referer: `https://www.youtube.com/watch?v=${this.options.id}`,
				},
			},
			true,
		);
		if (body) {
			let pfn = Path.parse(this.fn);
			pfn.base = '';
			pfn.ext = `.${code}.${fmt}`;
			fs.writeFileSync(Path.format(pfn), body, {
				encoding: 'utf8',
			});
		}
	}

	async makeSubtitle(url, code, translate) {
		let promises = [];
		let fmts = this.options.subtitleFormat.split`,`;
		for (let k = 0; k < fmts.length; k++) {
			let fmt = fmts[k];
			let promise;
			switch (fmt) {
				case 'vtt':
				case 'ttml':
				{
					promise = this.makeSubtitleFmt(
							fmt, url, code, translate
					);
					break;
				}
				default: {
					promise = this.makeSRT(
							url, code, translate
					);
				}
			}
			promises.push(promise);
		}
		await Promise.all(promises);
	}

	// download captions and create subtitle files
	async subtitles() {
		if (this.hasCaptions && this.fn.length && this.options.subtitles !== 'none') {
			let langs = this.options.subtitles.split(',');
			for (let i = 0; i < langs.length; i++) {
				let language = langs[i];
				let code = language.trim();
				let found = false;
				for (let j = 0; j < this.captions.length; j++) {
					let caption = this.captions[j];
					if (code === caption.code) {
						await this.makeSubtitle(caption.url, code, false);
						found = true;
					}
				}
				if (!found) {
					let caption = this.captions[this.defaultCaptions];
					await this.makeSubtitle(caption.url, code, true);
				}
			}
		}
	}

	// initiate comments request
	async fetchComments(options, proceed = true) {
		this.commentOptions = { ...this.commentOptions, ...options };
		this.commentData = [];
		this.commentMore = '';
		this.commentPage = 0;
		this.quantity = 0;
		this.results = [];
		let postData = ut.js({
			playbackContext: {
				contentPlaybackContext: {
					vis: 0,
					lactMilliseconds: '-1',
				},
			},
			context: this.session.context,
			videoId: this.options.id,
		});
		let hdrs = {
			'content-type': 'application/json',
			'content-length': Buffer.byteLength(postData, 'utf8'),
			referer: `https://www.youtube.com/watch?v=${this.options.id}`,
			'x-goog-authuser': '0',
			'x-goog-visitor-id': this.session.context.client.visitorData,
			'x-youtube-client-name': '1',
			'x-youtube-client-version': this.session.context.client.clientVersion,
			'x-origin': 'https://www.youtube.com',
		};
		if (this.session.loggedIn) hdrs.authorization = this.session.player.idhashFn(this.sapisid);
		let body = await this.httpsPost(
			`https://www.youtube.com/youtubei/v1/next?key=${this.session.key}`,
			{
				path: `/youtubei/v1/next?key=${this.session.key}`,
				headers: hdrs,
			},
			postData,
			true,
		);
		if (body) {
			this.commentData.push(ut.jp(body));
			try {
				let c = this.commentData[this.commentPage].contents.twoColumnWatchNextResults.results.results.contents;
				c.forEach(r => {
					if (r.itemSectionRenderer) {
						let cc = r.itemSectionRenderer.contents;
						cc.forEach(m => {
							if (m.messageRenderer) {
								this.status = 'ERROR';
								this.reason = m.messageRenderer.text.runs[0].text;
								this.commentCount = 0;
							} else if (m.commentsEntryPointHeaderRenderer) {
								this.commentCount = ut.viewQ(m.commentsEntryPointHeaderRenderer.commentCount.simpleText);
							} else if (m.continuationItemRenderer) {
								this.status = 'OK';
								this.reason = '';
								this.commentMore = m.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
								let ep = this.commentData[this.commentPage].engagementPanels;
								if (ep) {
									ep.forEach(pr => {
										if (pr.panelIdentifier === 'comment-item-section') {
											let prc = pr.header.engagementPanelTitleHeaderRenderer
												.menu.sortFilterSubMenuRenderer.subMenuItems;
											prc.forEach(o => {
												if ((o.title === 'Top comments' && this.commentOptions.order === 'top') ||
													(o.title === 'Newest first' && this.commentOptions.order === 'new')) {
													this.commentMore = o.serviceEndpoint.continuationCommand.token;
													this.commentOrder = this.commentOptions.order;
												}
											});
										}
									});
								}
							}
						});
					}
				});
				await this.continued(proceed);
			} catch (e) { this.debug(e); }
		}
	}

	// extract comment text and metadata
	async commentProcess(items, now) {
		let found = [];
		this.commentMore = '';
		try {
			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				let m = item.continuationItemRenderer;
				let c = item.commentThreadRenderer;
				if (c) {
					try {
						let cc = c.comment.commentRenderer;
						if (cc.commentId) {
							this.quantity++;
							let comment = new Comment(this, null);
							comment.id = cc.commentId;
							comment.author = cc.authorText.simpleText;
							let pt = cc.authorThumbnail.thumbnails;
							if (pt && pt.length) {
								pt.forEach(t => {
									if (t.url) comment.thumbnail = t.url;
								});
							}
							comment.channelId = cc.authorEndpoint.browseEndpoint.browseId;
							comment.text = '';
							let cr = cc.contentText.runs;
							cr.forEach(t => {
								comment.text += t.text;
							});
							if (cc.publishedTimeText) {
								comment.published = now - (1000 * ut.ageSec(cc.publishedTimeText.runs[0].text));
							}
							if (cc.voteCount) comment.likes = ut.viewQ(cc.voteCount.simpleText);
							if (cc.replyCount) {
								comment.replyCount = cc.replyCount;
								comment.more = c.replies.commentRepliesRenderer.contents[0].continuationItemRenderer
									.continuationEndpoint.continuationCommand.token;
								if (this.commentOptions.replies) await comment.fetch();
							}
							found.push(comment);
						}
					} catch (e) { this.debug(e); }
				} else if (m) {
					try {
						this.commentMore = m.continuationEndpoint.continuationCommand.token;
					} catch (e) { this.debug(e); }
				}
			}
		} catch (e) { this.debug(e); }
		found.forEach(e => {
			this.results.push(e);
			this.add(e);
		});
	}

	// comment continuation if required
	async continued(proceed = true) {
		if (!this.commentMore.length) {
			this.status = 'OK';
			this.reason = '';
		} else {
			let last = this.quantity;
			let postData = ut.js({
				context: this.session.context,
				continuation: this.commentMore,
			});
			let body = await this.httpsPost(
				`https://www.youtube.com/youtubei/v1/next?key=${this.session.key}`,
				{
					path: `/youtubei/v1/next?key=${this.session.key}`,
					headers: {
						'content-type': 'application/json',
						'content-length': Buffer.byteLength(postData, 'utf8'),
						'x-goog-visitor-id': this.session.context.client.visitorData,
					},
				},
				postData,
				true,
			);
			if (body) {
				this.commentPage++;
				this.commentData.push(ut.jp(body));
				try {
					let orre = this.commentData[this.commentPage].onResponseReceivedEndpoints;
					let gi;
					let redirect = false;
					orre.forEach(g => {
						if (g.reloadContinuationItemsCommand) {
							let temp = g.reloadContinuationItemsCommand.continuationItems;
							temp.forEach(sub => {
								if (sub.commentsHeaderRenderer) {
									this.commentCount = ut.viewQ(sub.commentsHeaderRenderer.countText.runs[0].text);
									if (this.commentOrder !== this.commentOptions.order) {
										let sm = sub.commentsHeaderRenderer.sortMenu
											.sortFilterSubMenuRenderer.subMenuItems;
										sm.forEach(o => {
											if ((o.title === 'Top comments' && this.commentOptions.order === 'top') ||
												(o.title === 'Newest first' && this.commentOptions.order === 'new')) {
												this.commentMore = o.serviceEndpoint.continuationCommand.token;
												this.commentOrder = this.commentOptions.order;
												redirect = true;
											}
										});
									}
								} else {
									gi = temp;
								}
							});
						} else if (g.appendContinuationItemsAction) {
							gi = g.appendContinuationItemsAction.continuationItems;
						}
					});
					if (redirect) {
						await this.continued(proceed);
					} else if (proceed) {
						await this.commentProcess(gi, ut.now());
						if ((!this.commentOptions.quantity ||
							this.quantity < this.commentOptions.quantity) &&
							(last < this.quantity)) await this.continued(proceed);
					}
				} catch (e) { this.debug(e); }
			}
		}
	}

	// create comment txt file
	async commentsText(options) {
		try {
			await this.fetchComments(options);
			let s = `${this.comments.length} of ${this.commentCount} ${this
				.commentOptions.order} comments for: ${this.title} (${this.id}) \n`;
			s += `By ${this.author} (${this.channelId}) \n\n`;
			this.comments.forEach(c => {
				s += `    From ${c.author} (${c.channelId}) : \n`;
				s += `    Commented ${ut.tsAge(c.published)} ago - Likes: ${c.likes} - Replies: ${c.replyCount} \n`;
				let xa = c.text.split(/\r?\n/);
				xa.forEach(l => {
					s += `    ${l}\n\n`;
				});
				if (c.replies.length) {
					c.replies.forEach(r => {
						s += `        Reply from ${r.author} (${r.channelId}) : \n`;
						s += `        Replied ${ut.tsAge(r.published)} ago - Likes: ${r.likes} \n`;
						let ta = r.text.split(/\r?\n/);
						ta.forEach(l => {
							s += `        ${l}\n\n`;
						});
					});
				}
			});
			if (!this.options.path.length) this.options.path = '.';
			this.cfn = `${this.options.path}/${this.filename(this.commentOptions.filename)}.txt`;
			fs.writeFileSync(this.cfn, s, 'utf8');
		} catch (e) {
			this.debug(e);
		}
	}
	// true if video has comments, false if no comments or comments are disabled
	async hasComments() {
		try {
			await this.fetchComments({ quantity: 1, replies: false, order: 'top' }, false);
		} catch (e) {
			this.debug(e);
		}
		return this.status === 'OK';
	}

	// download request based on an optional options object. Checked downloaded,
	// current timestamp if successful, 0 if failed.
	async download(options = {}) {
		try {
			this.downloaded = 0;
			this.updateOptions(options);
			if (!this.hasMedia) await this.fetch();
			if (this.hasMedia) await this.dl(this.options.videoFormat, this.options.audioFormat);
			if (this.hasCaptions && this.options.subtitles !== 'none') await this.subtitles();
		} catch (e) {
			this.debug(e);
		}
	}

	updateOptions(newOptions) {
		this.options = { ...this.options, ...newOptions };
		if (['mp3', 'flac'].includes(this.options.container)) this.options.videoQuality = 'none';
	}

	// cancel the current download
	cancel() {
		if (!this.cancelled && !this.downloaded) {
			this.cancelled = true;
			if (this.child !== null) this.child.send({ msg: 'cancel' });
		}
	}
}

module.exports = Video;
