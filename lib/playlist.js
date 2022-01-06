// ytcog - innertube library - playlist object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut.js')();
const Model = require('./model.js');
const Video = require('./video.js');

// playlist object retrieves playlist information and videos from the playlist
class Playlist extends Model {
	// construct the playlist, requires an active session object and options: {id}
	constructor(session, options) {
		super(session.cookie, session.userAgent);
		if (session.common.agent) this.common.agent = session.common.agent;
		this.type = 'playlist';
		this.session = session;
		this.quantity = 0;
		this.views = -1;
		this.videoCount = -1;
		this.published = 0;
		this.compiler = '';
		this.channelId = '';
		this.channelThumb = '';
		this.results = [];
		this.videos = [];
		this.updated = 0;
		this.id = options.id;
		this.options = {
			id: options.id,
			quantity: 100,
		};
		this.title = '';
		this.thumbnail = '';
		this.page = 0;
		this.more = '';
	}

	// process the retrieved videos, create Video objects
	process(videos) {
		let found = [];
		this.more = '';
		try {
			videos.forEach(v => {
				let c = v.continuationItemRenderer;
				let w = v.playlistVideoRenderer;
				if (w && w.videoId) {
					try {
						this.quantity++;
						let video = new Video(this.session, { id: w.videoId });
						if (w.title) w.title.runs.forEach(e => { video.title += e.text; });
						video.duration = parseInt(w.lengthSeconds);
						video.author = w.shortBylineText.runs[0].text;
						video.channelId = w.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;
						if (video.channelId === this.channelId) {
							video.channelThumb = this.channelThumb;
						}
						found.push(video);
					} catch (e) { this.debug(e); }
				} else if (c) {
					try {
						this.more = c.continuationEndpoint.continuationCommand.token;
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
		let postData = ut.js({
			context: this.session.context,
			browseId: `VL${this.options.id}`,
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
						let tx = ra.text.runs[0];
						if (tx.text) this.reason = tx.text;
					}
				}
			} catch (e) { this.debug(e); }
			if (this.status !== 'ERROR') {
				this.updated = ut.now();
				try {
					let md = this.data[0].sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer;
					let tn = md.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails;
					if (tn && tn.length) {
						tn.forEach(t => {
							this.thumbnail = t.url;
						});
					}
					this.title = md.title.runs[0].text;
					this.videoCount = ut.viewQ(md.stats[0].runs[0].text);
					this.views = ut.viewQ(md.stats[1].simpleText);
					let ur = md.stats[2].runs;
					let s = '';
					ur.forEach(t => { s += t.text; });
					if (s.length) this.published = ut.now() - (1000 * ut.ageSec(s));
				} catch (e) { this.debug(e); }
				try {
					let mo = this.data[0].sidebar.playlistSidebarRenderer.items[1]
						.playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer;
					let th = mo.thumbnail.thumbnails;
					th.forEach(t => {
						this.channelThumb = t.url;
					});
					let co = mo.title.runs[0];
					this.compiler = co.text;
					this.channelId = co.navigationEndpoint.browseEndpoint.browseId;
				} catch (e) { this.debug(e); }
				try {
					let gi = this.data[0].contents.twoColumnBrowseResultsRenderer.tabs[0]
						.tabRenderer.content.sectionListRenderer.contents[0]
						.itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
					this.process(gi);
					if (this.quantity < this.options.quantity) {
						await this.continued();
					} else {
						this.status = 'OK';
						this.reason = '';
					}
				} catch (e) {
					this.debug(e);
					this.status = 'OK';
					this.reason = '';
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
					this.process(gi);
					if ((this.quantity < this.options.quantity) && (last < this.quantity)) {
						await this.continued();
					}
				} catch (e) {
					this.debug(e);
				}
			}
		}
	}
}

module.exports = Playlist;
