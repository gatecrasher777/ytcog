// ytcog - innertube library - player object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const querystring = require('querystring');
const vm = require('vm2');
const ut = require('./ut')();
const Model = require('./model');

// player object retrieves player information and extracts functions to transform streams and authorise requests
class Player extends Model {
	// contructor requires an active session
	constructor(session) {
		super(session.cookie, session.userAgent);
		if (session.common.agent) this.common.agent = session.common.agent;
		this.type = 'player';
		this.session = session;
		this.context = new vm.VM();
		this.decipherFn = ytcogsig => ytcogsig;
		this.ncodeFn = ytncode => ytncode;
		this.idhashFn = ytcogsapisid => ytcogsapisid;
	}

	// extract signature manipulations - caller is the section of the player body concerned
	extractManipulations(caller) {
		let fname = ut.pinch(caller, 'a=a.split("");', '.', 0, 0, '', false);
		let ffunc = `var ${fname}={`;
		return ut.block(this.data, ffunc, 1, '{', '}', '{}', false);
	}

	// extracts signature decipher function
	extractDecipher() {
		let fname = ut.pinch(this.data, 'a.set("alr","yes");c&&(c=', '(decodeURIC', 0, 0, '', false);
		let ffunc = `${fname}=function(a)`;
		ffunc = `var ${ut.block(this.data, ffunc, 0, '{', '}', '{}', false)}`;
		ffunc = `${this.extractManipulations(ffunc)};${ffunc};return ${fname}(ytcogsig);`;
		let decipherScript = new vm.VMScript(`( function(ytcogsig) {${ffunc}} )`).compile();
		this.decipherFn = this.context.run(decipherScript);
	}

	// extracts n parameter encoding function
	extractNCode() {
		let fname = ut.pinch(this.data, '&&(b=a.get("n"))&&(b=', '(b)', 0, 0, '', false);
		if (fname.indexOf('[') !== -1) {
			fname = ut.pinch(this.data, `${fname.split('[')[0]}=[`, ']', 0, 0, '', false);
		}
		let ffunc = `${fname}=function(a)`;
		ffunc = `var ${ut.block(this.data, ffunc, 0, '{', '}', '{}', false)}`;
		ffunc = `${ffunc};return ${fname}(ytcogncode);`;
		let ncodeScript = new vm.VMScript(`( function(ytcogncode) {${ffunc}} )`).compile();
		this.ncodeFn = this.context.run(ncodeScript);
	}

	// extracts sapisid authorisation hashing function
	extractIdHash() {
		let start = '();b.update(a);return b.';
		let prefix = ut.pinch(this.data, start, '();', start.length + 6, 0, '', false);
		let fname = ut.pinch(prefix, '=', '();', 0, 0, '', false);
		let fname2 = ut.pinch(this.data, start, '()', 0, 0, '', false);
		let ffunc = `${fname}=function()`;
		ffunc = `var ${ut.block(this.data, ffunc, 0, '{', '}', '{}', false)}`;
		ffunc = `${ffunc};
            var host = "https://www.youtube.com";
            var ts = Math.floor((new Date).getTime() / 1E3);
            var encode = ${fname}();
            encode.update([ts, ytcogsapisid, host].join(" "));
            var hash = encode.${fname2}().toLowerCase();
            var enjoins = function(a,b,c) {
                return  [a,[b,c].join("_")].join(" ");
            };
            return enjoins('SAPISIDHASH',ts,hash);
        `;
		let idhashScript = new vm.VMScript(`( function(ytcogsapisid) {${ffunc}} )`).compile();
		this.idhashFn = this.context.run(idhashScript);
	}

	// process the retrieved player
	process() {
		try {
			this.extractDecipher();
			this.extractNCode();
			this.extractIdHash();
		} catch (e) {
			this.debug(e);
			this.status = 'NOK';
			this.reason = 'Could not extract player functions';
		}
	}

	// retrieve the player
	async fetch() {
		this.data = await this.httpsGet(
			`https://www.youtube.com${this.session.playerUrl}`,
			{
				path: this.session.playerUrl,
				headers: {
					'content-type': 'text/javascript',
				},
			},
			false,
		);
		if (this.data) {
			this.process();
		} else {
			this.status = 'NOK';
			this.reason = 'Could not find player';
		}
	}

	// deciphers ciphered signatures, returns the transformed url
	decipher(url) {
		let args = querystring.parse(url);
		if (args.s === undefined) return args.url;
		let sig = this.decipherFn(decodeURIComponent(args.s));
		let components = new URL(decodeURIComponent(args.url));
		if (args.sp !== undefined) {
			components.searchParams.set(args.sp, sig);
		} else {
			components.searchParams.set('signature', sig);
		}
		return components.toString();
	}

	// applies ncode to url containing an n parameter, returns the transformed url
	ncode(url) {
		let components = new URL(decodeURIComponent(url));
		let n = components.searchParams.get('n');
		if (!n) return url;
		n = this.ncodeFn(n);
		components.searchParams.set('n', n);
		return components.toString();
	}

	// adapts a media stream by applying ncode and decipher functions
	adapt(stream) {
		if (stream.decipher) {
			stream.url = this.ncode(this.decipher(stream.url));
		} else {
			stream.url = this.ncode(stream.url);
		}
	}
}

module.exports = Player;
