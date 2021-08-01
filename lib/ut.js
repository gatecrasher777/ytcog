// ytcog - innertube library - utility class
// repository https://github.com/gatecrasher777/ytfomo
// (c) 2021 gatecrasher777
// MIT Licence

const coCo = {
    "Afghanistan": "af",
    "Aland Islands": "ax",
    "Albania": "al",
    "Algeria": "dz",
    "American Samoa": "as",
    "Andorra": "ad",
    "Angola": "ao",
    "Anguilla": "ai",
    "Antarctica": "aq",
    "Antigua and Barbuda": "ag",
    "Argentina": "ar",
    "Armenia": "am",
    "Aruba": "aw",
    "Australia": "au",
    "Austria": "at",
    "Azerbaijan": "az",
    "Bahamas": "bs",
    "Bahrain": "bh",
    "Bangladesh": "bd",
    "Barbados": "bb",
    "Belarus": "by",
    "Belgium": "be",
    "Belize": "bz",
    "Benin": "bj",
    "Bermuda": "bm",
    "Bhutan": "bt",
    "Bolivia, Plurinational State of": "bo",
    "Bonaire, Saint Eustatius and Saba": "bq",
    "Bosnia and Herzegovina": "ba",
    "Botswana": "bw",
    "Brazil": "br",
    "British Indian Ocean Territory": "io",
    "Brunei Darussalam": "bn",
    "Bulgaria": "bg",
    "Burkina Faso": "bf",
    "Burundi": "bi",
    "Cambodia": "kh",
    "Cameroon": "cm",
    "Canada": "ca",
    "Cape Verde": "cv",
    "Cayman Islands": "ky",
    "Central African Republic": "cf",
    "Chad": "td",
    "Chile": "cl",
    "China": "cn",
    "Kosovo": "undefined",
    "Colombia": "co",
    "Comoros": "km",
    "Congo": "cg",
    "Congo, The Democratic Republic of the": "cd",
    "Cook Islands": "ck",
    "Costa Rica": "cr",
    "Cote d'Ivoire": "ci",
    "Croatia": "hr",
    "Cuba": "cu",
    "Curacao": "cw",
    "Cyprus": "cy",
    "Czech Republic": "cz",
    "Czechia": "cz",
    "Denmark": "dk",
    "Djibouti": "dj",
    "Dominica": "dm",
    "Dominican Republic": "do",
    "Ecuador": "ec",
    "Egypt": "eg",
    "El Salvador": "sv",
    "Equatorial Guinea": "gq",
    "Eritrea": "er",
    "Estonia": "ee",
    "Ethiopia": "et",
    "Falkland Islands (Malvinas)": "fk",
    "Faroe Islands": "fo",
    "Fiji": "fj",
    "Finland": "fi",
    "France": "fr",
    "French Guiana": "gf",
    "French Polynesia": "pf",
    "French Southern Territories": "tf",
    "Gabon": "ga",
    "Gambia": "gm",
    "Georgia": "ge",
    "Germany": "de",
    "Ghana": "gh",
    "Gibraltar": "gi",
    "Greece": "gr",
    "Greenland": "gl",
    "Grenada": "gd",
    "Guadeloupe": "gp",
    "Guam": "gu",
    "Guatemala": "gt",
    "Guernsey": "gg",
    "Guinea": "gn",
    "Guinea-Bissau": "gw",
    "Guyana": "gy",
    "Haiti": "ht",
    "Holy See (Vatican City State)": "va",
    "Honduras": "hn",
    "Hong Kong": "hk",
    "Hungary": "hu",
    "Iceland": "is",
    "India": "in",
    "Indonesia": "id",
    "Iran, Islamic Republic of": "ir",
    "Iraq": "iq",
    "Ireland": "ie",
    "Isle of Man": "im",
    "Israel": "il",
    "Italy": "it",
    "Jamaica": "jm",
    "Japan": "jp",
    "Jersey": "je",
    "Jordan": "jo",
    "Kazakhstan": "kz",
    "Kenya": "ke",
    "Kiribati": "ki",
    "Korea, Democratic People's Republic of": "kp",
    "Kuwait": "kw",
    "Kyrgyzstan": "kg",
    "Lao People's Democratic Republic": "la",
    "Latvia": "lv",
    "Lebanon": "lb",
    "Lesotho": "ls",
    "Liberia": "lr",
    "Libya": "ly",
    "Liechtenstein": "li",
    "Lithuania": "lt",
    "Luxembourg": "lu",
    "Macao": "mo",
    "Macedonia, The Former Yugoslav Republic of": "mk",
    "Madagascar": "mg",
    "Malawi": "mw",
    "Malaysia": "my",
    "Maldives": "mv",
    "Mali": "ml",
    "Malta": "mt",
    "Marshall Islands": "mh",
    "Martinique": "mq",
    "Mauritania": "mr",
    "Mauritius": "mu",
    "Mayotte": "yt",
    "Mexico": "mx",
    "Micronesia, Federated States of": "fm",
    "Moldova, Republic of": "md",
    "Monaco": "mc",
    "Mongolia": "mn",
    "Montenegro": "me",
    "Montserrat": "ms",
    "Morocco": "ma",
    "Mozambique": "mz",
    "Myanmar": "mm",
    "Namibia": "na",
    "Nauru": "nr",
    "Nepal": "np",
    "Netherlands": "nl",
    "New Caledonia": "nc",
    "New Zealand": "nz",
    "Nicaragua": "ni",
    "Niger": "ne",
    "Nigeria": "ng",
    "Niue": "nu",
    "Norfolk Island": "nf",
    "Northern Mariana Islands": "mp",
    "Norway": "no",
    "Oman": "om",
    "Pakistan": "pk",
    "Palau": "pw",
    "West Bank": "ps",
    "Panama": "pa",
    "Papua New Guinea": "pg",
    "Paraguay": "py",
    "Peru": "pe",
    "Philippines": "ph",
    "Pitcairn": "pn",
    "Poland": "pl",
    "Portugal": "pt",
    "Puerto Rico": "pr",
    "Qatar": "qa",
    "Reunion": "re",
    "Romania": "ro",
    "Russia": "ru",
    "Rwanda": "rw",
    "Saint Barthelemy": "bl",
    "Saint Helena, Ascension and Tristan da Cunha": "sh",
    "Saint Kitts and Nevis": "kn",
    "Saint Lucia": "lc",
    "Saint Martin (French part)": "mf",
    "Saint Pierre and Miquelon": "pm",
    "Saint Vincent and the Grenadines": "vc",
    "Samoa": "ws",
    "San Marino": "sm",
    "Sao Tome and Principe": "st",
    "Saudi Arabia": "sa",
    "Senegal": "sn",
    "Serbia": "rs",
    "Seychelles": "sc",
    "Sierra Leone": "sl",
    "Singapore": "sg",
    "Sint Maarten (Dutch part)": "sx",
    "Slovakia": "sk",
    "Slovenia": "si",
    "Solomon Islands": "sb",
    "Somalia": "so",
    "South Africa": "za",
    "South Korea": "kr",
    "South Sudan": "ss",
    "Spain": "es",
    "Sri Lanka": "lk",
    "Sudan": "sd",
    "Suriname": "sr",
    "Svalbard and Jan Mayen": "sj",
    "Swaziland": "sz",
    "Sweden": "se",
    "Switzerland": "ch",
    "Syrian Arab Republic": "sy",
    "Taiwan, Province of China": "tw",
    "Tajikistan": "tj",
    "Tanzania, United Republic of": "tz",
    "Thailand": "th",
    "Timor-Leste": "tl",
    "Togo": "tg",
    "Tokelau": "tk",
    "Tonga": "to",
    "Trinidad and Tobago": "tt",
    "Tunisia": "tn",
    "Turkey": "tr",
    "Turkmenistan": "tm",
    "Turks and Caicos Islands": "tc",
    "Tuvalu": "tv",
    "Uganda": "ug",
    "Ukraine": "ua",
    "United Arab Emirates": "ae",
    "United Kingdom": "gb",
    "United States": "us",
    "United States Minor Outlying Islands": "um",
    "Uruguay": "uy",
    "Uzbekistan": "uz",
    "Vanuatu": "vu",
    "Venezuela, Boliletian Republic of": "ve",
    "Viet Nam": "vn",
    "Virgin Islands, British": "vg",
    "Virgin Islands, U.S.": "vi",
    "Wallis and Futuna": "wf",
    "Western Sahara": "eh",
    "Yemen": "ye",
    "Zambia": "zm",
    "Zimbabwe": "zw",
    "Bouvet Island": "bv",
    "Cocos (Keeling) Islands": "cc",
    "Christmas Island": "cx",
    "South Georgia and the South Sandwich Islands": "gs",
    "Heard Island and McDonald Islands": "hm"
}

class utClass {

	constructor() {
        this.ver = '0.0';
	}
    
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

    adaptive(s,l) {
        if (s<0) {  
            s = -s; 
            if (l==0) {  
                return s*1000;
            } else {
                let e = (Date.now() - l) / 1000; 
                let a = [60,120,180,300,600,900,1800,3600,3600,3600,3600,3600,3600];
                let x = a.indexOf(s);          
                if (e<21600) return a[x]*1000; 
                if (e<86400) return a[x+1]*1000; 
                if (e<172800) return a[x+2]*1000; 
                if (e<259200) return a[x+3]*1000; 
                if (e<432000) return a[x+4]*1000; 
                return a[x+5]*1000;               
            }
        } else {
            return s*1000;
        }
    }

    meta(s,f,x) {
        let m = JSON.parse(s);
        if (m === null) return '';
        if (m[f] === undefined) return '';
        if (x != '') {
            if (x == 'array') return m[f].join(', ');
            return m[f][x];
        }
        return m[f];
    }

    ff() {
        let date = new Date();
        let version = ((date.getFullYear() - 2018) * 4 + Math.floor(date.getMonth() / 4) + 58) + ".0";
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version} Gecko/20100101 Firefox/${version}`;
    }

    run(e,f,a,b,c) {
        let r;
        if ((e.length !== undefined) && (e.value === undefined)) {
            e.forEach(i => f(i,a,b,c));
        } else{
            r = f(e,a,b,c);
        }
        return r;
    }

    select(t, f, a, b, c) {
        let e;
        switch (t.substr(0,1)) {
            case '#' : e = document.getElementById(t.substr(1)); break;
            case '.': e = document.querySelectorAll(t); break;
            default : e = document.querySelector(t); break;
        }
        let r;
        if ((e !== null) && (f !== undefined)) {
            if (typeof a === 'object') {
                Object.keys(a).forEach( k => this.run(e,f,k,a[k],b));
            } else {
                r = this.run(e,f,a,b,c);
            }
        }
        if (r === undefined) return e;
        return r;
    }

    html(t,s) {
        if (s === undefined ) return this.select(t,(e)=>{ return e.innerHTML});
        return this.select(t, (e,s) => { e.innerHTML = s} , s);
    }

    attr(t,a) {
        return this.select(t, (e,k,v) => { e.setAttribute(k,v); }, a);
    }

    css(t,a) {
        return this.select(t, (e,k,v) => { e.style[k] = v; } , a);
    }

    replaceWith(t,s) {
        this.after(t,s);
        return this.remove(t) 
    }

    remove(t) {
        return this.select(t, (e) => { e.parentNode.removeChild(e) } );
    }

    offset(t) {
        return this.select(t, (e) => { 
            let o = e.getBoundingClientRect();
            return {
                top: o.top + window.scrollY, 
                left: o.left + window.scrollX, 
            }
        }); 
    }
    
    exists(t) {
        return (this.select(t) !== null);
    }

    removeAttr(t,s) {
        return this.select(t, (e,s)=>{ e.removeAttribute(s); }, s);
    }

    removeClass(t,s) {
       return this.select(t, (e,s) => { e.classList.remove(s); }, s);
    }

    width(t) {
        return this.select(t, e => parseFloat(getComputedStyle(e, null).width.replace('px', '')));
    }

    height(t) {
        return this.select(t, e => parseFloat(getComputedStyle(e, null).height.replace('px', '')));
    }

    outerWidth(t) {
        return this.select(t, e => parseFloat(e.offsetWidth));
    }

    outerHeight(t) {
        return this.select(t, e => parseFloat(e.offsetHeight));
    }

    append(t,s) {
        return this.select(t, (e,s) => { e.insertAdjacentHTML('beforeend', s) },s);
    }

    after(t,s) {
        return this.select(t, (e,s) => { e.insertAdjacentHTML('afterend',s) }, s );
    }

    prepend(t,s) {
        return this.select(t, (e,s) => { e.insertAdjacentHTML('afterbegin',s) }, s );
    }

    before(t,s) {
        return this.select(t, (e,s) => { e.insertAdjacentHTML('beforebegin',s) }, s );
    }

    addClass(t,s) {
        return this.select(t, (e,s) => { e.classList.add(s); }, s); 
    }

    val(t,v) {
        return this.prop(t,'value',v);
    }

    style(t,s,v) {
        if (v === undefined) return this.select(t, (e,s) => { return e.style[s] }, s); 
        return this.select(t, (e,s,v) => { e.style[s]=v }, s, v);
    }

    prop(t,s,v) {
        if (v === undefined) return this.select(t, (e,s) => { return e[s] }, s);
        return this.select(t, (e,s,v) => { e[s]=v }, s, v);
    }

    position(t) {
        return this.select(t, (e) => {
            return {
                top: e.getBoundingClientRect().top,
                left: e.getBoundingClientRect().left
            }
        });
    }

    click(t) {
        return this.select(t, (e) => {e.click()} );
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

    pid(p) { // "/s/player/375e32fd/player_ias.vflset/en_US/base.js"
        let z = p.split('/');
        if ((z.length>=3) && (z[3].length==8)) return z[3];
        return '';
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