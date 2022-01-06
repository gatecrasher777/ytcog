// ytcog - innertube library - channel object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut')();
const Model = require('./model.js');
const Video = require('./video.js');
const Playlist = require('./playlist');

// channel object retrieves channel information and videos
class Channel extends Model {
	// construct the channel, requires an active session object and options: {id[,order,quantity]}
	constructor(session, options) {
		super(session.cookie, session.userAgent);
		if (session.common.agent) this.common.agent = session.common.agent;
		this.type = 'channel';
		this.session = session;
		this.quantity = 0;
		this.results = [];
		this.videos = [];
		this.channels = [];
		this.playlists = [];
		this.spmap = {
			'videos,new': 'EgZ2aWRlb3MYAyAAMAE%3D',
			'videos,old': 'EgZ2aWRlb3MYAiAAMAE%3D',
			'videos,views': 'EgZ2aWRlb3MYASAAMAE%3D',
			'playlists,new': 'EglwbGF5bGlzdHMYAyABMAE%3D',
			'playlists,updated': 'EglwbGF5bGlzdHMYBCABMAE%3D',
			'channels,new': 'EghjaGFubmVscw%3D%3D',
			'about,new': 'EgVhYm91dA%3D%3D',
			'search,new': 'EgZzZWFyY2g%3D',
		};
		this.id = options.id;
		this.videoCount = -1;
		this.views = -1;
		this.subscribers = -1;
		this.joined = 0;
		this.updated = 0;
		this.profiled = 0;
		this.latest = 0;
		this.author = '';
		this.description = '';
		this.thumbnail = '';
		this.country = '';
		this.tags = [];
		this.options = {
			id: options.id,
			items: 'videos',
			order: 'new',
			quantity: 60,
			query: '',
		};
		this.updateOptions(options);
		this.page = 0;
		this.more = '';
	}

	// convert options into innertube parameters
	get params() {
		let sp = `${this.options.items},${this.options.order}`;
		let code = this.spmap[`${this.options.items},new`];
		if (this.spmap[sp]) code = this.spmap[sp];
		if (!code) code = this.spmap['videos,new'];
		return code;
	}

	// process the retrieved items, create video, playlist or channel objects
	process(items, now) {
		let found = [];
		this.more = '';
		try {
			items.forEach(item => {
				let m = item.continuationItemRenderer;
				let w = item.gridVideoRenderer;
				let p = item.gridPlaylistRenderer;
				let c = item.gridChannelRenderer;
				let v = item.itemSectionRenderer;
				if (v) {
					try {
						v = v.contents[0].videoRenderer;
					} catch (e) { this.debug(e); }
				}
				if (w && w.videoId) {
					try {
						this.quantity++;
						let ts = 0;
						if (w.publishedTimeText) {
							ts = now - (1000 * ut.ageSec(w.publishedTimeText.simpleText));
						}
						let video = new Video(this.session, { id: w.videoId, published: ts });
						if (w.title) w.title.runs.forEach(e => { video.title += e.text; });
						if (w.thumbnailOverlays && w.thumbnailOverlays.length) {
							let a = w.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer;
							if (a && a.text) video.duration = ut.durSec(a.text.simpleText);
						}
						if (w.viewCountText) video.views = ut.viewQ(w.viewCountText.simpleText);
						if (ts > this.latest) this.latest = ts;
						video.author = this.author;
						video.channelId = this.id;
						video.channelThumb = this.thumbnail;
						video.country = this.country;
						found.push(video);
					} catch (e) { this.debug(e); }
				} else if (c && c.channelId) {
					try {
						this.quantity++;
						let channel = new Channel(this.session, { id: c.channelId });
						let ct = c.thumbnail.thumbnails;
						if (ct) {
							ct.forEach(t => {
								if (t.url) channel.thumbnail = t.url;
							});
						}
						let cv = c.videoCountText;
						if (cv && cv.runs && cv.runs.length) channel.videoCount = ut.viewQ(cv.runs[0].text);
						let cs = c.subscriberCountText;
						if (cs && cs.simpleText) channel.subscribers = ut.viewQ(cs.simpleText);
						if (c.title && c.title.simpleText) channel.author = c.title.simpleText;
						found.push(channel);
					} catch (e) { this.debug(e); }
				} else if (p && p.playlistId) {
					try {
						this.quantity++;
						let playlist = new Playlist(this.session, { id: p.playlistId });
						let pt = p.thumbnail.thumbnails;
						if (pt && pt.length) {
							pt.forEach(t => {
								if (t.url) playlist.thumbnail = t.url;
							});
						}
						if (p.title.runs[0].text) playlist.title = p.title.runs[0].text;
						if (p.videoCountShortText.simpleText) playlist.videoCount = ut.viewQ(p.videoCountShortText.simpleText);
						playlist.compiler = this.author;
						playlist.channelId = this.id;
						found.push(playlist);
					} catch (e) { this.debug(e); }
				} else if (v && v.videoId) {
					try {
						this.quantity++;
						let ts = 0;
						if (v.publishedTimeText) {
							ts = now - (1000 * ut.ageSec(v.publishedTimeText.simpleText));
						}
						let video = new Video(this.session, { id: v.videoId, published: ts });
						if (v.title) v.title.runs.forEach(e => { video.title += e.text; });
						if (v.descriptionSnippet) v.descriptionSnippet.runs.forEach(e => { video.description += e.text; });
						if (v.lengthText) video.duration = ut.durSec(v.lengthText.simpleText);
						if (v.viewCountText) video.views = ut.viewQ(v.viewCountText.simpleText);
						video.author = this.author;
						video.channelId = this.id;
						video.channelThumb = this.thumbnail;
						video.country = this.country;
						if (ts > this.latest) this.latest = ts;
						found.push(video);
					} catch (e) { this.debug(e); }
				} else if (m) {
					try {
						this.more = m.continuationEndpoint.continuationCommand.token;
					} catch (e) { this.debug(e); }
				}
			});
		} catch (e) { this.debug(e); }
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
		let postData = {
			context: this.session.context,
			params: this.params,
			browseId: this.options.id,
		};
		if (this.options.items === 'search') postData.query = this.options.query;
		postData = ut.js(postData);
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
			`https://www.youtube.com/youtubei/v1/browse?key=${this.session.key}`,
			{
				path: `/youtubei/v1/browse?key=${this.session.key}`,
				headers: hdrs,
			},
			postData,
			true,
		);
		if (body) {
			this.data.push(ut.jp(body));
			try {
				let ra = this.data[0].alerts;
				if (ra && ra.length) {
					ra = ra[0].alertRenderer;
					if (ra) {
						if (ra.type) this.status = ra.type;
						let tx = ra.text;
						if (tx.simpleText) this.reason = tx.simpleText;
					}
				}
			} catch (e) { this.debug(e); }
			if (this.status !== 'ERROR') {
				this.options.items === 'about' ? this.profiled = ut.now() : this.updated = ut.now();
				let tabs = this.data[0].contents.twoColumnBrowseResultsRenderer.tabs;
				try {
					let md = this.data[0].metadata.channelMetadataRenderer;
					if (md.externalId) this.id = md.externalId;
					if (md.title) this.author = md.title;
					if (md.description) this.description = md.description;
					let th = md.avatar.thumbnails[0];
					if (th.url) this.thumbnail = th.url;
				} catch (e) { this.debug(e); }
				try {
					let hd = this.data[0].header.c4TabbedHeaderRenderer.subscriberCountText;
					if (hd && hd.simpleText) this.subscribers = ut.viewQ(hd.simpleText);
				} catch (e) { this.debug(e); }
				try {
					let mf = this.data[0].microformat.microformatDataRenderer;
					if (mf.tags) this.tags = mf.tags;
				} catch (e) { this.debug(e); }
				let gi;
				if (tabs) {
					tabs.forEach(tab => {
						if (tab.expandableTabRenderer && this.options.items === 'search') {
							try {
								gi = tab.expandableTabRenderer.content.sectionListRenderer.contents;
							} catch (e) {
								this.debug(e);
								this.status = 'OK';
								this.reason = 'No results';
							}
						} else if (tab.tabRenderer && tab.tabRenderer.title.toLowerCase() === this.options.items) {
							if (this.options.items === 'about') {
								try {
									let md = tab.tabRenderer.content.sectionListRenderer.contents[0]
										.itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
									let vc = md.viewCountText;
									if (vc && vc.simpleText) this.views = ut.viewQ(vc.simpleText);
									let jd = md.joinedDateText.runs[1];
									if (jd && jd.text) this.joined = ut.dateTS(jd.text);
									let co = md.country;
									if (co && co.simpleText) this.country = co.simpleText;
								} catch (e) {
									this.debug(e);
									this.status = 'NOK';
									this.reason = 'Could not find channel metadata';
								}
							} else {
								try {
									gi = tab.tabRenderer.content.sectionListRenderer.contents[0]
										.itemSectionRenderer.contents[0].gridRenderer.items;
								} catch (e) {
									this.debug(e);
									this.status = 'OK';
									this.reason = 'No results';
								}
							}
						}
					});
					if (gi && gi.length) {
						try {
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
			}
		}
	}

	// continuation if required
	async continued() {
		if (!this.more.length) {
			this.status = 'OK';
			this.reason = '';
		} else {
			let last = this.quantity;
			let postData = ut.js({
				context: this.session.context,
				continuation: this.more,
			});
			let body = await this.httpsPost(
				`https://www.youtube.com/youtubei/v1/browse?key=${this.session.key}`,
				{
					path: `/youtubei/v1/browse?key=${this.session.key}`,
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
					let gi = this.data[this.page].onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;
					this.process(gi, this.updated);
					if ((this.quantity < this.options.quantity) && (last < this.quantity)) {
						await this.continued();
					}
				} catch (e) { this.debug(e); }
			}
		}
	}
}

module.exports = Channel;
