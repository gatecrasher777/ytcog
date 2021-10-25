// ytcog - innertube library - session object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ut = require('./ut')();
const Model = require('./model');
const Player = require('./player');

// session object retrieves session prerequisites for channel, search and video requests
class Session extends Model {
	// constructor, accepts optional cookie and user agent strings
	constructor(cookie, userAgent, proxy) {
		super(cookie, userAgent, proxy);
		this.type = 'session';
		this.context = {};
		this.key = '';
		this.sts = '';
		this.id_token = '';
		this.session_token = '';
		this.visitor_data = '';
		this.playerUrl = '';
		this.loggedIn = false;
		this.player = {};
	}

	// process the retrieved innertube configuration object
	async process() {
		try {
			let j = this.data;
			this.context = j.INNERTUBE_CONTEXT;
			this.key = j.INNERTUBE_API_KEY;
			this.id_token = j.ID_TOKEN;
			this.session_token = j.XSRF_TOKEN;
			this.playerUrl = j.PLAYER_JS_URL;
			this.sts = j.STS;
			this.loggedIn = j.LOGGED_IN;
			if (j.SBOX_SETTINGS && j.SBOX_SETTINGS.VISITOR_DATA && this.context &&
				this.context.client && !this.context.client.visitorData) {
				this.context.client.visitorData = j.SBOX_SETTINGS.VISITOR_DATA;
			}
			this.context.user = {};
			if (this.context && this.context.client) this.context.client.hl = 'en';
			this.player = new Player(this);
			if (this.playerUrl.length) await this.player.fetch();
			this.status = this.player.status;
			this.reason = this.player.reason;
		} catch (e) {
			this.debug(e);
			this.status = 'NOK';
			this.reason = 'Could not load player';
		}
	}

	// fetch the yt home page and extract the innertube configuration object
	async fetch() {
		try {
			let result = await this.httpsGet('https://www.youtube.com', {}, true);
			if (result) {
				do {
					this.data = ut.jp(ut.pinch(result, 'ytcfg.set({', '});', 1, 1, '{}', true));
					if (this.data.INNERTUBE_CONTEXT) {
						await this.process();
						result = '';
					}
				} while (result.length);
			}
			if (!this.key.length || (!this.context || !this.context.client || !this.context.client.visitorData)) {
				this.status = 'NOK';
				this.reason = 'Session data not found';
			}
		} catch (e) { this.debug(e); }
	}
}

module.exports = Session;
