// ytcog - innertube library - channel object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut')();
const Model = require('./model.js');
const Video = require('./video.js');


class Channel extends Model {
	
	constructor(session,options) {  
		super(session.cookie,session.userAgent);
		this.type = 'channel';
		this.session = session;
		this.quantity = 0;
		this.videos = [];
		this.spmap = {
			"new":"EgZ2aWRlb3MYAyAAMAE%3D",
			"old":"EgZ2aWRlb3MYAiAAMAE%3D",
			"views":"EgZ2aWRlb3MYASAAMAE%3D",
			"about": "EgVhYm91dA%3D%3D"
		};
		this.id = options.id;
		this.views = -1,
		this.subscribers = -1,
		this.joined = 0,
		this.updated = 0,
		this.profiled = 0;
		this.latest = 0;
		this.author = '';
		this.description = '';
		this.thumbnail = '';
		this.country = '';
		this.tags = [];
		this.options = {
			id: options.id, //any search term
			order: 'new', // new, old, views, profile
			quantity: 60 //maximum number of results 
		}
		this.updateOptions(options);
		this.page = 0;
		this.more = '';
	}

	get params() { 
		let sp = this.options.order
		let code = this.spmap[sp];
		if (!code) code = this.spmap["new"];
		return code;
	}

	process(videos,now) { 
		let found = [];
		try{
			videos.forEach((v,i,a)=>{
				let c = v.continuationItemRenderer;
				let w = v.gridVideoRenderer;
				if ((w) && (w.videoId)) {
					try{
						this.quantity++;
						let ts = 0;
						if (w.publishedTimeText) {
							ts = now - 1000*ut.ageSec(w.publishedTimeText.simpleText);
						}
						let video = new Video(this.session,{id:w.videoId, published:ts});
						if (w.title) w.title.runs.forEach((e)=>{video.title+=e.text});
						if ((w.thumbnailOverlays) && (w.thumbnailOverlays.length)) {
							let a = w.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer;
							if ((a) && (a.text)) video.duration = ut.durSec(a.text.simpleText);
						}
						if (w.viewCountText) video.views = ut.viewQ(w.viewCountText.simpleText);
						if (ts>this.latest) this.latest=ts;
						video.author = this.author;
						video.channelThumb = this.thumbnail;
						video.country = this.country;
						found.push(video);
					} catch(e) {this.log(e)}
				} else if (c) {
					try{
						this.more = c.continuationEndpoint.continuationCommand.token;
					} catch(e) {this.log(e)}
				}
			});
		} catch(e) {this.log(e)}
		return found;
	}

	async fetch() { 
		this.page = 0;
		this.data = [];
		this.quantity = 0;
		this.videos = [];
		let postData = ut.js({
			context: this.session.context,
			params: this.params,
			browseId: this.options.id
		});
		let hdrs = {
			'content-type': 'application/json',
			'content-length': Buffer.byteLength(postData,'utf8'),
			'x-goog-authuser': '0',
			'x-goog-visitor-id': this.session.context.client.visitorData,
			'x-youtube-client-name': '1',
			'x-youtube-client-version': this.session.context.client.clientVersion,
			'x-origin': 'https://www.youtube.com'
		};
		if (this.session.loggedIn) hdrs['authorization'] = this.session.player.idhashFn(this.sapisid);
		let body = await this.httpsPost(
			'https://www.youtube.com/youtubei/v1/browse?key='+this.session.key,
			{
				path: '/youtubei/v1/browse?key='+this.session.key,
				headers: hdrs
			},
			postData,
			true
		);
		if (body) {
			this.data.push(ut.jp(body));
			try {
				let ra = this.data[0].alerts[0].alertRenderer;
				if (ra.type) this.status = ra.type;
				let tx = ra.text;
				if (tx.simpleText) this.reason = tx.simpleText;
			} catch(e) {}
			if (this.status != 'ERROR') {
				(this.options.order=='about') ? this.profiled = ut.now() : this.updated = ut.now();
				try {  
					let md = this.data[0].metadata.channelMetadataRenderer;
					if (md.externalId) this.id = md.externalId; 
					if (md.title) this.author = md.title;
					if (md.description) this.description = md.description;
					let th = md.avatar.thumbnails[0];
					if (th.url) this.thumbnail = th.url;
				} catch(e) {}
				try { 
					let hd = this.data[0].header.c4TabbedHeaderRenderer.subscriberCountText;
					if (hd.simpleText) this.subscribers = ut.viewQ(hd.simpleText);
				} catch(e) {}
				try { 
					let mf = this.data[0].microformat.microformatDataRenderer;
					if (mf.tags) this.tags = mf.tags; 
				} catch(e) {}
				try { 
					let md = this.data[0].contents.twoColumnBrowseResultsRenderer.tabs[5].
						tabRenderer.content.sectionListRenderer.contents[0].
						itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
					let vc = md.viewCountText;
					if (vc.simpleText) this.views = ut.viewQ(vc.simpleText);
					let jd = md.joinedDateText.runs[1];
					if (jd.text) this.joined = ut.dateTS(jd.text);
					let co = md.country;
					if (co.simpleText) this.country = co.simpleText;
				} catch(e) {}
				try {
					let gi = this.data[0].contents.twoColumnBrowseResultsRenderer.tabs[1].
						tabRenderer.content.sectionListRenderer.contents[0].
						itemSectionRenderer.contents[0].gridRenderer.items;
					this.videos = this.process(gi,this.updated);  
					if (this.quantity < this.options.quantity) {
						await this.continued();
					} else {
						this.status = 'OK';
						this.reason = '';
					}
				} catch(e) {
					this.status = 'OK';
					this.reason = '';
				}
			}
		}
	}

	async continued() {
		if (!this.more.length) { 
			this.status = 'OK';
			this.reason = '';
		} else {
			let last = this.quantity;
			let postData = ut.js({
				context: this.session.context,
				continuation: this.more				
			});
			let body = await this.httpsPost(
				'https://www.youtube.com/youtubei/v1/browse?key='+this.session.key,
				{
					path: '/youtubei/v1/browse?key='+this.session.key,
					headers: {
						'content-type': 'application/json',
						'content-length': Buffer.byteLength(postData,'utf8'),
						'x-goog-visitor-id': this.session.context.client.visitorData,
					},
				},
				postData,
				true
			);
			if (body) {	
				this.page++;
				this.data.push(ut.jp(body));
				try {
					let gi = this.data[this.page].onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;
					let found = this.process(gi,this.updated);
					found.forEach((e,i,a)=>{
						this.videos.push(e);
					});
					if ((this.quantity < this.options.quantity) && (last<this.quantity)) {
						await this.continued();
					} 
				} catch(e) {
					console.log(e);
				}
			}
		} 
	}

}

module.exports=Channel;