// ytcog - innertube library - comment object class
// (c) 2021-22 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut.js')();
const Model = require('./model.js');

// comment object retrieves comment information and replies to the comment
class Comment extends Model {
	// construct the comment, requires an active video object
	constructor(video, comment) {
		super(video.session.cookie, video.session.userAgent);
		if (video.session.common.agent) this.common.agent = video.session.common.agent;
		this.type = 'comment';
		this.comment = comment;
		if (this.comment !== null) this.type = 'replie';
		this.video = video;
		this.session = video.session;
		this.quantity = 0;
		this.likes = 0;
		this.dislikes = -1;
		this.published = 0;
		this.author = '';
		this.channelId = '';
		this.thumbnail = '';
		this.results = [];
		this.replies = [];
		this.replyCount = 0;
		this.id = '';
		this.text = '';
		this.page = 0;
		this.options = video.commentOptions;
		this.more = '';
	}

	// process data
	process(items, now) {
		let found = [];
		this.more = '';
		try {
			items.forEach(item => {
				let m = item.continuationItemRenderer;
				let cc = item.commentRenderer;
				if (cc && cc.commentId) {
					try {
						this.quantity++;
						let comment = new Comment(this.video, this);
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
						found.push(comment);
					} catch (e) { this.debug(e); }
				} else if (m) {
					try {
						this.more = m.button.buttonRenderer.command.continuationCommand.token;
					} catch (e) { this.debug(e); }
				}
			});
		} catch (e) { this.debug(e); }
		found.forEach(e => {
			this.results.push(e);
			this.add(e);
		});
	}

	// whether original comment
	get isComment() {
		return this.comment === null;
	}

	// whether comment is a reply to another comment
	get isReply() {
		return !this.isComment;
	}

	// initiate fetch of replies to comment
	async fetch() {
		this.data = [];
		this.page = -1;
		this.quantity = 0;
		this.results = [];
		await this.continued();
	}

	// comment continuation if required
	async continued() {
		if (!this.more.length) {
			this.status = 'OK';
			this.reason = '';
		} else {
			// let last = this.quantity;
			let postData = ut.js({
				context: this.session.context,
				continuation: this.more,
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
				this.page++;
				this.data.push(ut.jp(body));
				try {
					let orre = this.data[this.page].onResponseReceivedEndpoints;
					let gi;
					orre.forEach(g => {
						if (g.reloadContinuationItemsCommand) {
							gi = g.reloadContinuationItemsCommand.continuationItems;
						} else if (g.appendContinuationItemsAction) {
							gi = g.appendContinuationItemsAction.continuationItems;
						}
					});
					this.process(gi, ut.now());
					if (this.quantity < this.replyCount) {
						await this.continued();
					}
				} catch (e) { this.debug(e); }
			}
		}
	}
}

module.exports = Comment;
