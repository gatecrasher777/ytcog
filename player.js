// ytcog - innertube library - player object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const urllib = require('url');
const querystring = require('querystring');
const ut = require('./ut')();
const Model = require('./model');

class Player extends Model {
	
	constructor(session) {
        super(session.cookie,session.userAgent);
        this.type = 'player';
        this.session = session;
        this.decipherFn = (sig) => {return sig};
        this.ncodeFn = (n) => { return n};
        this.idhashFn = (id) => { return id};
	}

    #extractManipulations(caller) {
        let fname = ut.pinch(caller,'a=a.split("");','.',0,0,'',false);
        let ffunc = 'var '+fname+'={';
        return ut.block(this.data,ffunc,1,'{','}','{}',false);
    }

	#extractDecipher() {
        let fname = ut.pinch(this.data,'a.set("alr","yes");c&&(c=','(decodeURIC',0,0,'',false);
        let ffunc = fname+'=function(a)';
        ffunc = 'var '+ut.block(this.data,ffunc,0,'{','}','{}',false);
        ffunc = this.#extractManipulations(ffunc)+';'+ffunc+';return '+fname+'(sig);';
        this.decipherFn = new Function('sig',ffunc);
	}

	#extractNCode() { 
        let fname = ut.pinch(this.data,'a.C&&(b=a.get("n"))&&(b=','(b)',0,0,'',false);
        let ffunc = fname+'=function(a)';
        ffunc = 'var '+ut.block(this.data,ffunc,0,'{','}','{}',false);
        this.ncodeFn = new Function('ncode',ffunc+'; return '+fname+'(ncode);');
    }

    #extractIdHash() {
        let start = '();b.update(a);return b.';
        let prefix = ut.pinch(this.data,start,'();',start.length+6,0,'',false);
        let fname = ut.pinch(prefix,'=','();',0,0,'',false);
        let fname2 = ut.pinch(this.data,start,'()',0,0,'',false);
        let ffunc = fname+'=function()';
        ffunc = 'var '+ut.block(this.data, ffunc, 0, '{','}','{}',false);
        this.idhashFn = new Function('sapisid', ffunc+`;
            var host = "https://www.youtube.com";
            var ts = Math.floor((new Date).getTime() / 1E3);
            var encode = ${fname}();
            encode.update([ts, sapisid, host].join(" "));
            var hash = encode.${fname2}().toLowerCase();
            var enjoins = function(a,b,c) {
                return  [a,[b,c].join("_")].join(" ");
            };
            return enjoins('SAPISIDHASH',ts,hash);
        `);
    }

    #process() {
        try {
            this.#extractDecipher();
            this.#extractNCode();
            this.#extractIdHash();
        } catch(e) {
            console.log(e);
            this.status = 'NOK';
            this.reason = 'Could not extract player functions'
        }
    }

	async fetch() {
        this.data = await this.httpsGet(
            'https://www.youtube.com'+this.session.playerUrl,
                {
                path: this.session.playerUrl,
                headers: {
                    'content-type': 'text/javascript'
                }
            },
            false
        );
        if (this.data) {
            this.#process();
        } else {
            this.status = 'NOK';
            this.reason = 'Could not find player'
        }
    }
	
    #decipher(url) {
        let args = querystring.parse(url);
        if (args.s === undefined) return args.url;
        let sig = this.decipherFn(decodeURIComponent(args.s));
        let components = new urllib.URL(decodeURIComponent(args.url));
        if (args.sp !== undefined) {
            components.searchParams.set(args.sp, sig);
        } else {
            components.searchParams.set('signature', sig);  
        }
        return components.toString();
    }

    #ncode(url) {
        let components = new urllib.URL(decodeURIComponent(url));
        let n = components.searchParams.get('n');
        if (!n) return url;
        n = this.ncodeFn(n);
        components.searchParams.set('n',n);
        return components.toString();
    }

    adapt(stream) {
        if (stream.decipher) {
            stream.url = this.#ncode(this.#decipher(stream.url));
        } else {
            stream.url = this.#ncode(stream.url);
        }
    }

}

module.exports=Player;
