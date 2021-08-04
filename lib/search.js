// ytcog - innertube library - search object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut.js')();
const Model = require('./model.js');
const Video = require('./video.js');

class Search extends Model {
	
	constructor(session,options) {
		super(session.cookie,session.userAgent);
		this.type = 'search';
		this.session = session;
		this.quantity = 0;
		this.videos = [];
		this.spmap = {
			"any,any,relevance":"EgIQAQ%3D%3D",
			"hour,any,relevance":"EgIIAQ%3D%3D",
			"day,any,relevance":"EgQIAhAB",
			"week,any,relevance":"EgQIAxAB",
			"month,any,relevance":"EgQIBBAB",
			"year,any,relevance":"EgQIBRAB",
			"any,short,relevance":"EgQQARgB",
			"hour,short,relevance":"EgYIARABGAE%3D",
			"day,short,relevance":"EgYIAhABGAE%3D",
			"week,short,relevance":"EgYIAxABGAE%3D",
			"month,short,relevance":"EgYIBBABGAE%3D",
			"year,short,relevance":"EgYIBRABGAE%3D",
			"any,long,relevance":"EgQQARgC",
			"hour,long,relevance":"EgYIARABGAI%3D",
			"day,long,relevance":"EgYIAhABGAI%3D",
			"week,long,relevance":"EgYIAxABGAI%3D",
			"month,long,relevance":"EgYIBBABGAI%3D",
			"year,long,relevance":"EgYIBRABGAI%3D",
			"any,any,age":"CAISAhAB",
			"hour,any,age":"CAISBAgBEAE%3D",
			"day,any,age":"CAISBAgCEAE%3D",
			"week,any,age":"CAISBAgDEAE%3D",
			"month,any,age":"CAISBAgEEAE%3D",
			"year,any,age":"CAISBAgFEAE%3D",
			"any,short,age":"CAISBBABGAE%3D",
			"hour,short,age":"CAISBggBEAEYAQ%3D%3D",
			"day,short,age":"CAISBggCEAEYAQ%3D%3D",
			"week,short,age":"CAISBggDEAEYAQ%3D%3D",
			"month,short,age":"CAISBggEEAEYAQ%3D%3D",
			"year,short,age":"CAISBggFEAEYAQ%3D%3D",
			"any,long,age":"CAISBBABGAI%3D",
			"hour,long,age":"CAISBggBEAEYAg%3D%3D",
			"day,long,age":"CAISBggCEAEYAg%3D%3D",
			"week,long,age":"CAISBggDEAEYAg%3D%3D",
			"month,long,age":"CAISBggEEAEYAg%3D%3D",
			"year,long,age":"CAISBggFEAEYAg%3D%3D",		
			"any,any,views":"CAMSAhAB",
			"hour,any,views":"CAMSBAgBEAE%3D",
			"day,any,views":"CAMSBAgCEAE%3D",
			"week,any,views":"CAMSBAgDEAE%3D",
			"month,any,views":"CAMSBAgEEAE%3D",
			"year,any,views":"CAMSBAgFEAE%3D",
			"any,short,views":"CAMSBBABGAE%3D",
			"hour,short,views":"CAMSBggBEAEYAQ%3D%3D",
			"day,short,views":"CAMSBggCEAEYAQ%3D%3D",
			"week,short,views":"CAMSBggDEAEYAQ%3D%3D",
			"month,short,views":"CAMSBggEEAEYAQ%3D%3D",
			"year,short,views":"CAMSBggFEAEYAQ%3D%3D",
			"any,long,views":"CAMSBBABGAI%3D",
			"hour,long,views":"CAMSBggBEAEYAg%3D%3D",
			"day,long,views":"CAMSBggCEAEYAg%3D%3D",
			"week,long,views":"CAMSBggDEAEYAg%3D%3D",
			"month,long,views":"CAMSBggEEAEYAg%3D%3D",
			"year,long,views":"CAMSBggFEAEYAg%3D%3D",		
			"any,any,rating":"CAESAhAB",
			"hour,any,rating":"CAESBAgBEAE%3D",
			"day,any,rating":"CAESBAgCEAE%3D",
			"week,any,rating":"CAESBAgDEAE%3D",
			"month,any,rating":"CAESBAgEEAE%3D",
			"year,any,rating":"CAESBAgFEAE%3D",
			"any,short,rating":"CAESBBABGAE%3D",
			"hour,short,rating":"CAESBggBEAEYAQ%3D%3D",
			"day,short,rating":"CAESBggCEAEYAQ%3D%3D",
			"week,short,rating":"CAESBggDEAEYAQ%3D%3D",
			"month,short,rating":"CAESBggEEAEYAQ%3D%3D",
			"year,short,rating":"CAESBggFEAEYAQ%3D%3D",
			"any,long,rating":"CAESBBABGAI%3D",
			"hour,long,rating":"CAESBggBEAEYAg%3D%3D",
			"day,long,rating":"CAESBggCEAEYAg%3D%3D",
			"week,long,rating":"CAESBggDEAEYAg%3D%3D",
			"month,long,rating":"CAESBggEEAEYAg%3D%3D",
			"year,long,rating":"CAESBggFEAEYAg%3D%3D"
    	};
		this.options = {
			query: 'video', //any search term
			period: 'day', //any,hour,day,week,month,year
			order: 'relevance', // relevance, age, views, rating
			duration: 'any',	// any, short, long
			quantity: 100	//maximum number of results 
		}
		this.updateOptions(options);
		this.page = 0;
		this.more = '';
	}
	
	get #params() { 
		let sp = this.options.period+','+this.options.length+','+this.options.order;
		let code = this.spmap[sp];
		if (!code) code = this.spmap['any,any,relevance'];
		return code;
	}
  
	#process(contents,now) { 
		let found = [];
		try{
			contents.forEach((s,i,a)=>{
				let c = s.continuationItemRenderer;
				let r = s.itemSectionRenderer
				if (r) {
					let videos = r.contents;
					videos.forEach( (v) => {
						let w = v.videoRenderer;
						if ((w) && (w.videoId)) {
							try{
								this.quantity++;
								let ts = 0;
								if (w.publishedTimeText) {
									ts = now - 1000*ut.ageSec(w.publishedTimeText.simpleText);
								}
								let video = new Video(this.session,{id:w.videoId, published:ts});
								if (w.title) w.title.runs.forEach((e)=>{video.title+=e.text});
								if ((w.detailedMetadataSnippets) && (w.detailedMetadataSnippets.length)) {
									let st = w.detailedMetadataSnippets[0].snippetText;
									if ((st) && (st.runs)) st.runs.forEach((e)=>{video.description+=e.text});
								}
								if (w.lengthText) video.duration = ut.durSec(w.lengthText.simpleText);
								let vc = w.viewCountText;
								if (vc) {
									if (vc.simpleText) {
										video.views = ut.viewQ(w.viewCountText.simpleText);
									} else {
										let r0 = vc.runs[0];
										if ((r0) && (r0.text !==undefined )) video.views = ut.viewQ(r0.text);
										let r1 = vc.runs[1];
										if ((r1) && (r1.text !==undefined ) && (r1.text == ' watching')) video.isLive = true;
									}
								}
								let r0 = w.longBylineText.runs[0];
								if (r0.text) video.author = r0.text;
								let be = r0.navigationEndpoint.browseEndpoint;
								if (be.browseId) video.channel = be.browseId;
								if (w.channelThumbnailSupportedRenderers) {
									let z = w.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer;
									if ((z) && (z.thumbnail)) video.channelThumb = z.thumbnail.thumbnails[0].url;
								}
								if (ts>this.latest) this.latest=ts;
								found.push(video);
							} catch(e) {
								console.log(e);
							}
						}
					});
				} else if (c) {
					try{
						this.more = c.continuationEndpoint.continuationCommand.token;
						if (this.more === undefined) this.more = '';
					} catch(e) {
						console.log(e);
					}
				}
			});
		} catch(e) {
			console.log(e);
		}
		return found;
	}
	
	async fetch() { 
		this.page = 0;
		this.data = [];
		this.quantity = 0;
		this.videos = [];
		let postData = ut.js({
			context: this.session.context,
			params: this.#params,
			query: this.options.query
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
			'https://www.youtube.com/youtubei/v1/search?key='+this.session.key,
			{
				path: '/youtubei/v1/search?key='+this.session.key,
				headers: hdrs
			},
			postData,
			true
		);
		if (body) {
			this.data.push(ut.jp(body));
			this.updated = ut.now();
			try {
				let gi = this.data[0].contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
				this.videos = this.#process(gi,this.updated);
				if (this.quantity < this.options.quantity) {
					await this.continued();
				} else {
					this.status = 'OK';
					this.reason = '';
				}
			} catch(e) {
				console.log(e);
				this.status = 'OK';
				this.reason = 'No results';
			}
		}
	}

	async continued() { 
		if ((this.more === undefined) || (!this.more.length)) { 
			this.status = 'OK';
			this.reason = '';
		} else {
			let last = this.quantity;
			let postData = ut.js({
				context: this.session.context,
				continuation: this.more
			});
			let body = await this.httpsPost(
				'https://www.youtube.com/youtubei/v1/search?key='+this.session.key,
				{
					path: '/youtubei/v1/search?key='+this.session.key,
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
					let rc = this.data[this.page].onResponseReceivedCommands;
					if (rc) {
						let gi = rc[0].appendContinuationItemsAction.continuationItems;
						let found = this.#process(gi,this.updated);
						found.forEach((e,i,a)=>{
							this.videos.push(e);
						});
						if ((this.quantity < this.options.quantity) && (last<this.quantity)) await this.continued();
					}
				} catch(e) {
					console.log(e);
				}
			}
		}
	}

}

module.exports=Search;