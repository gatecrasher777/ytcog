// ytcog - innertube library - session object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytfomo
// MIT Licenced

const ut = require('./ut.js')();
const fs = require('fs');
const Model = require('./model.js');
const Player = require('./player.js');

class Session extends Model {
	
	constructor(cookie,userAgent) {
		super(cookie,userAgent);
		this.context = {};
		this.key = '';
		this.id_token = '';
		this.session_token = '';
		this.player = {};
	}
	
	async process() {
		try {
			let j = this.data;
			this.context = j.INNERTUBE_CONTEXT;
			this.key = j.INNERTUBE_API_KEY;
			this.id_token = j.ID_TOKEN;
			this.session_token = j.XSRF_TOKEN;
			this.playerUrl = j.WEB_PLAYER_CONTEXT_CONFIGS.WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH.jsUrl;
			this.context.user = {};
			this.player = new Player(this);
			await this.player.fetch();
			this.status = this.player.status;
			this.reason = this.player.reason;
		} catch(e) {
			this.status = 'NOK';
			this.reason = 'Could not load player'
		}
	}

	async fetch() {
		let result = await this.httpsGet('https://www.youtube.com',{},true);
		if (result) {
			do {
				this.data = ut.jp(ut.pinch(result,'ytcfg.set({','});',1,1,'{}',true));
				if (this.data.INNERTUBE_CONTEXT) {
					await this.process();
					result = '';
				}
			} while (result.length);
		}
		if ((!this.key.length) || (!this.context || !this.context.client || !this.context.client.visitorData)) {
			this.status = 'NOK';
			this.reason = 'Session data not found';
		} 
	}

}

module.exports=Session;