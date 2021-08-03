// ytcog - innertube library - utility class
// repository https://github.com/gatecrasher777/ytfomo
// (c) 2021 gatecrasher777
// MIT Licence

class utClass {
    
    js(o) {
        try {
            return JSON.stringify(o);
        } catch(e) {
            return "{}";
        }
    }

    jp(s) {
        try {
            return JSON.parse(s);
        } catch(e) {
            return this.jp(this.js(s));
        }
    }

    jsp(o) {
        try {
            return JSON.stringify(o,null,2);
        } catch(e) {
            return "{}";
        }
    }

    upMin(u) {
        let ad = '';
        if (u<0) {
            u = -u;
            ad = '*';
        }
        if (!u) return 'manual';
        if (u<60) return u+' sec'+ad;
        if (u<3600) return u/60+' min'+ad;
        if (u<86400) return u/3600+' hr'+ad;
        return u/86400+' day'+ad
    }

    tsAge(ts) {
        if (!ts) return '';
        let s = Math.floor((Date.now() - ts)/1000);
        if (s<=0) return 'now'
        if (s<60) return s+'s';
        let m = Math.floor(s/60);
        s = s % 60;
        if (m<60) return m+'m'+s+'s';
        let h = Math.floor(m/60);
        m = m % 60;
        if (h<24) return h+'h'+m+'m';
        let d = Math.floor(h/24);
        h = h % 24;
        if (d<7) return d+'d'+h+'h';
        let w = Math.floor(d/7);
        d = d % 7;
        if (w<5) return w+'w'+d+'d';
        let mm = Math.floor(w*12/52.1786);
        w = Math.floor(w % (52.1786/12));
        if (mm<12) return mm+'m'+w+'w';
        let y = Math.floor(mm/12);
        mm = mm % 12;
        return y+'y'+mm+'m';
    }

    ageSec(a) {
        if (a.includes('Streamed ')) a = a.substr(9);
        let q = parseInt(a.substr(0,2));
        if (isNaN(q)) return 0;
        if (a.includes('second')) return q;
        if (a.includes('minute')) return 60*q;
        if (a.includes('hour')) return 60*60*q;
        if (a.includes('day')) return 24*60*60*q;
        if (a.includes('week')) return 7*24*60*60*q;
        if (a.includes('month')) return 52*7*24*60*60*q/12;
        if (a.includes('year')) return 52*7*24*60*60*q;
        return 0;
    }

    qFmt(q,g) {
        if ((q === undefined) || (q === null)) return 'n/a';
        if (g===undefined) g='b';
        const suffix = ['','k','m',g,'t'];
        let c = 0;
        do {
            if (q<0) return 'n/a';
            if (c) {
                if (q<10) return q.toFixed(2)+suffix[c];
                if (q<100) return q.toFixed(1)+suffix[c];
            }
            if (q<1000) return q.toFixed(0)+suffix[c];
            q = q/1000;
            c++;
        } while (q>0.5);
    }

    viewQ(v) {
        if (v == null) return 0;
        if (v === undefined) return 0;
        let s = v.split(' ');
        let c = 0;
        s.forEach( (e)=> {
            let s = e.replace(/,/g, '');
            let vc = parseFloat(s);
            if (!isNaN(vc)) { 
                c = vc;
                if (e.includes('K')) c=c*1000;
                if (e.includes('M')) c=c*1000000;
                if (e.includes('B')) c=c*1000000000;
            }
        });
        return Math.floor(c);
    }
    
    secDur(s) {
        let h = Math.floor(s/3600);
        let m = Math.floor((s-3600*h)/60);
        s = s % 60;
        if (h) return h+':'+(100+m).toString().substr(1)+':'+(100+s).toString().substr(1);
        if (m) return m+':'+(100+s).toString().substr(1);
        return '0:'+(100+s).toString().substr(1);
    }

    durSec(v) {
        if (v === undefined) return 0;
        let r = 0;
        let s = v.split(':');
        s.forEach((e)=>{
            r *= 60;
            r += parseInt(e);
        });
        return r;
    }    

    rating(v) {
        if (v>=1) {
            let r = v-1;
            let p = 100*r/4;
            if (p<0) p=0;
            return Math.floor(p)+'%';
        } 
        return '';
    }

    now() {
        return Date.now();
    }

    dateTS(s) {
        return Date.parse(s+' 00:00:00 GMT');
    }

    ff() {
        let date = new Date();
        let version = ((date.getFullYear() - 2018) * 4 + Math.floor(date.getMonth() / 4) + 58) + ".0";
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version} Gecko/20100101 Firefox/${version}`;
    }

    nmb(v,f) { 
        if (f=='rating') return parseInt(v)/25+1;
        let a = parseInt(v);
        let s = v.replace(a.toString(),'');
        if (!s.length) return a;
        if (s.length == 1) {
            switch (s) {
                case 's': return a;
                case 'k': return a*1000;
                case 'b': return a*1000*1000*1000;
                case 'm': 
                    if (['views','subscribers'].includes(f)) return a*1000*1000;
                    if (f=='joined') return a*7*52/12;
                    return a*60;
                case 'h': return 3600*a;
                case 'd': return 3600*24*a;
                case 'w': return 3600*24*7*a; 
                case 'y': return 365.25*3600*24*a;
                default: ;
            }
        }
        return v;
    }

    pinch(body,start,end,snip,enip,empty,truncate) {
		let extract = empty;
		let spos = body.indexOf(start);
		let slen = start.length;
		if (spos>=0) {
            let next = body.substr(spos+slen-snip);
			let epos = next.indexOf(end);
			if (epos>=0) {
				extract = next.substr(0,epos+enip);
				if (truncate) body = body.substr(spos+slen-snip+epos+enip);
			} else {
				extract = body.substr(spos+slen-snip);
				if (truncate) body = '';
			}
		} else {
			if (truncate) body = '';
		}
		return extract;
	}

    block(body,start,snip,open,close,empty,truncate) {
		let extract = empty;
		let spos = body.indexOf(start);
		let slen = start.length;
		if (spos>=0) {
            let pos = spos+slen-snip;
            let done = false;
            let level = 0;
            extract = start.substr(0,slen-snip);
            while (!done) {
                switch (body[pos]) {
                    case open : 
                        level++; 
                        break;
                    case close : 
                        level--; 
                        if (!level) done = true;
                        break;
                }
                extract += body[pos];
                pos++;
                if (pos>=body.length) done = true;
            }
            if (truncate) body = body.substring(0,pos);
		} else {
			if (truncate) body = '';
		}
		return extract;
	}

}

function utInit() {
	return new utClass;
}

try {
	module.exports = utInit;
} catch (e) {}