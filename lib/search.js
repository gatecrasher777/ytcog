// ytcog - innertube library - search object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut.js')();
const Model = require('./model.js');
const Video = require('./video.js');
const Channel = require('./channel.js');
const Playlist = require('./playlist.js');

// search object retrieves channel information and videos
class Search extends Model {
	// construct the channel, requires an active session object and options: {id[,order,quantity]}
	constructor(session, options) {
		super(session.cookie, session.userAgent);
		if (session.common.agent) this.common.agent = session.common.agent;
		this.type = 'search';
		this.session = session;
		this.quantity = 0;
		this.latest = 0;
		this.results = [];
		this.videos = [];
		this.channels = [];
		this.playlists = [];
		this.estimated = 0;
		this.options = {
			query: 'video',
			order: 'relevance',
			period: 'day',
			items: 'videos',
			duration: 'any',
			features: '',
			quantity: 100,
		};
		this.updateOptions(options);
		this.page = 0;
		this.more = '';
	}

	// convert options into an innertube search parameter
	get params() {
		let d = new Uint8Array(50);
		let t = 0;
		let c = 0;
		if (this.options.order !== 'relevance') {
			d[t] = 0x08; t++;
			d[t] = ['relevance', 'rating', 'age', 'views'].indexOf(this.options.order); t++;
		}
		d[t] = 0x12; t++;
		c = t; t++;
		if (this.options.period !== 'any') {
			d[t] = 0x8; t++;
			d[t] = ['any', 'hour', 'day', 'week', 'month', 'year'].indexOf(this.options.period); t++;
		}
		if (this.options.items !== 'any') {
			d[t] = 0x10; t++;
			d[t] = ['any', 'videos', 'channels', 'playlists', 'movies'].indexOf(this.options.items); t++;
		}
		if (this.options.duration !== 'any') {
			d[t] = 0x18; t++;
			d[t] = ['any', 'short', 'long', 'medium'].indexOf(this.options.duration); t++;
		}
		if (this.options.features.length) {
			let z = this.options.features.split(',');
			z.forEach(f => {
				switch (f.trim()) {
					case 'live':
						d[t] = 0x40;
						t++;
						break;
					case '4k':
						d[t] = 0x70;
						t++;
						break;
					case 'hd':
						d[t] = 0x20;
						t++; break;
					case 'subtitles':
						d[t] = 0x28;
						t++;
						break;
					case 'cc':
						d[t] = 0x30;
						t++;
						break;
					case '360':
						d[t] = 0x78;
						t++;
						break;
					case 'vr180':
						d[t] = 0xd0;
						t++;
						d[t] = 0x01;
						t++;
						break;
					case '3d':
						d[t] = 0x38;
						t++;
						break;
					case 'hdr':
						d[t] = 0xc8;
						t++;
						d[t] = 0x01;
						t++;
						break;
					case 'location':
						d[t] = 0xb8;
						t++;
						d[t] = 0x01;
						t++;
						break;
					case 'purchased':
						d[t] = 0x48;
						t++;
						break;
				}
				d[t] = 0x01;
				t++;
			});
		}
		d[c] = t - c - 1;
		let n = Buffer.from(d.slice(0, t));
		let s = n.toString('base64');
		return encodeURIComponent(s);
	}

	// process the retrieved videos, create Video objects
	process(contents, now) {
		let found = [];
		this.more = '';
		try {
			contents.forEach(s => {
				let m = s.continuationItemRenderer;
				let r = s.itemSectionRenderer;
				if (r) {
					let items = r.contents;
					items.forEach(item => {
						let v = item.videoRenderer;
						let c = item.channelRenderer;
						let p = item.playlistRenderer;
						if (v && v.videoId) {
							try {
								this.quantity++;
								let ts = 0;
								if (v.publishedTimeText) {
									ts = now - (1000 * ut.ageSec(v.publishedTimeText.simpleText));
								}
								let video = new Video(this.session, { id: v.videoId, published: ts });
								if (v.title) v.title.runs.forEach(e => { video.title += e.text; });
								if (v.detailedMetadataSnippets && v.detailedMetadataSnippets.length) {
									let st = v.detailedMetadataSnippets[0].snippetText;
									if (st && st.runs) st.runs.forEach(e => { video.description += e.text; });
								}
								if (v.lengthText) video.duration = ut.durSec(v.lengthText.simpleText);
								let vc = v.viewCountText;
								if (vc) {
									if (vc.simpleText) {
										video.views = ut.viewQ(v.viewCountText.simpleText);
									} else {
										let r0 = vc.runs[0];
										if (r0 && (r0.text !== undefined)) video.views = ut.viewQ(r0.text);
										let r1 = vc.runs[1];
										if (r1 && (r1.text !== undefined) && (r1.text === ' watching')) video.isLive = true;
									}
								}
								let r0 = v.longBylineText.runs[0];
								if (r0.text) video.author = r0.text;
								let be = r0.navigationEndpoint.browseEndpoint;
								if (be.browseId) video.channelId = be.browseId;
								if (v.channelThumbnailSupportedRenderers) {
									let z = v.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer;
									if (z && z.thumbnail) video.channelThumb = z.thumbnail.thumbnails[0].url;
								}
								if (ts > this.latest) this.latest = ts;
								found.push(video);
							} catch (e) {
								this.debug(e);
							}
						} else if (c && c.channelId) {
							try {
								this.quantity++;
								let channel = new Channel(this.session, { id: c.channelId });
								if (c.title && c.title.simpleText) channel.author = c.title.simpleText;
								let cd = c.descriptionSnippet;
								if (cd && cd.runs) cd.runs.forEach(ss => { channel.description += ss.text; });
								let cv = c.videoCountText;
								if (cv && cv.runs && cv.runs.length) channel.videoCount = ut.viewQ(cv.runs[0].text);
								let cs = c.subscriberCountText;
								if (cs && cs.simpleText) channel.subscribers = ut.viewQ(cs.simpleText);
								let ct = c.thumbnails;
								if (ct) {
									ct.forEach(t => {
										if (t.url) channel.thumbnail = t.url;
									});
								}
								found.push(channel);
							} catch (e) {
								this.debug(e);
							}
						} else if (p && p.playlistId) {
							try {
								this.quantity++;
								let playlist = new Playlist(this.session, { id: p.playlistId });
								let pt = p.title;
								if (pt && pt.simpleText) playlist.title = pt.simpleText;
								pt = p.thumbnails;
								if (pt && pt.length) {
									let th = pt[0].thumbnails;
									if (th && th.length) {
										th.forEach(t => {
											if (t.url) playlist.thumbnail = t.url;
										});
									}
								}
								if (p.videoCount) playlist.videoCount = ut.viewQ(p.videoCount);
								let pl = p.longBylineText;
								if (pl && pl.runs && pl.runs.length) {
									if (pl.runs[0].text) playlist.compiler = pl.runs[0].text;
									let pn = pl.runs[0].navigationEndpoint;
									if (pn && pn.browseEndpoint) {
										let pb = pn.browseEndpoint.browseId;
										if (pb) playlist.channelId = pb;
									}
								}
								pt = p.publishedTimeText;
								if (pt && pt.simpleText) playlist.published = ut.ageSec(pt.simpleText);
								found.push(playlist);
							} catch (e) {
								this.debug(e);
							}
						}
					});
				} else if (m) {
					try {
						this.more = m.continuationEndpoint.continuationCommand.token;
						if (this.more === undefined) this.more = '';
					} catch (e) {
						this.debug(e);
					}
				}
			});
		} catch (e) {
			this.debug(e);
		}
		found.forEach(e => {
			this.results.push(e);
			this.add(e);
		});
	}

	// initial fetch request
	async fetch(options) {
		if (options) this.updateOptions(options);
		this.page = 0;
		this.data = [];
		this.quantity = 0;
		this.results = [];
		this.estimated = 0;
		let postData = ut.js({
			context: this.session.context,
			params: this.params,
			query: this.options.query,
		});
		let hdrs = {
			'content-type': 'application/json',
			'content-length': Buffer.byteLength(postData, 'utf8'),
			'x-goog-authuser': '0',
			'x-goog-visitor-id': this.session.context.client.visitorData,
			'x-youtube-client-name': '1',
			'x-youtube-client-version': this.session.context.client.clientVersion,
			'x-origin': 'https://www.youtube.com',
		};
		if (this.session.loggedIn) hdrs.authorization = this.session.player.idhashFn(this.sapisid);
		let body = await this.httpsPost(
			`https://www.youtube.com/youtubei/v1/search?key=${this.session.key}`,
			{
				path: `/youtubei/v1/search?key=${this.session.key}`,
				headers: hdrs,
			},
			postData,
			true,
		);
		if (body) {
			this.data.push(ut.jp(body));
			this.updated = ut.now();
			try {
				if (this.data[0].estimatedResults) this.estimated = ut.viewQ(this.data[0].estimatedResults);
				let gi = this.data[0].contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
				this.process(gi, this.updated);
				if (this.quantity < this.options.quantity) {
					await this.continued();
				} else {
					this.status = 'OK';
					this.reason = '';
				}
			} catch (e) {
				this.debug(e);
				this.status = 'OK';
				this.reason = 'No results';
			}
		}
	}

	// continuation if required
	async continued() {
		if ((this.more === undefined) || !this.more.length) {
			this.status = 'OK';
			this.reason = '';
		} else {
			let last = this.quantity;
			let postData = ut.js({
				context: this.session.context,
				continuation: this.more,
			});
			let body = await this.httpsPost(
				`https://www.youtube.com/youtubei/v1/search?key=${this.session.key}`,
				{
					path: `/youtubei/v1/search?key=${this.session.key}`,
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
				this.page++;
				this.data.push(ut.jp(body));
				try {
					let rc = this.data[this.page].onResponseReceivedCommands;
					if (rc) {
						let gi = rc[0].appendContinuationItemsAction.continuationItems;
						this.process(gi, this.updated);
						if ((this.quantity < this.options.quantity) && (last < this.quantity)) {
							await this.continued();
						} else {
							this.status = 'OK';
							this.reason = '';
						}
					}
				} catch (e) {
					this.debug(e);
					this.status = 'OK';
					this.reason = '';
				}
			}
		}
	}
}

module.exports = Search;
