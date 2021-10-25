// ytcog - innertube library - utility class -
// repository https://github.com/gatecrasher777/ytfomo
// (c) 2021 gatecrasher777
// MIT Licence

// utility class provides various useful functions
class utClass {
	// stringify js object into json
	js(o) {
		try {
			return JSON.stringify(o);
		} catch (e) {
			return '{}';
		}
	}

	// parse json into js object
	jp(s) {
		try {
			return JSON.parse(s);
		} catch (e) {
			return this.jp(this.js(s));
		}
	}

	// pretty print js object
	jsp(o) {
		try {
			return JSON.stringify(o, null, 2);
		} catch (e) {
			return '{}';
		}
	}

	ts2date(ts) {
		let dt = new Date(ts);
		return dt.toISOString().substr(0, 10);
	}

	ts2datetime(ts) {
		let dt = new Date(ts);
		let ds = dt.toISOString();
		return `${ds.substr(0, 10)} ${ds.substr(11, 8)}`;
	}

	ts2timestamp(ts) {
		let dt = Math.floor(ts / 1000);
		return dt.toString();
	}

	// convert a timestamp into an age string
	tsAge(ts) {
		if (!ts) return '';
		let s = Math.floor((Date.now() - ts) / 1000);
		if (s <= 0) return 'now';
		if (s < 60) return `${s}s`;
		let m = Math.floor(s / 60);
		s %= 60;
		if (m < 60) return `${m}m${s}s`;
		let h = Math.floor(m / 60);
		m %= 60;
		if (h < 24) return `${h}h${m}m`;
		let d = Math.floor(h / 24);
		h %= 24;
		if (d < 7) return `${d}d${h}h`;
		let w = Math.floor(d / 7);
		d %= 7;
		if (w < 4) return `${w}w${d}d`;
		let mm = Math.floor(w * 12 / 52.1786);
		w = Math.floor(w % (52.1786 / 12));
		if (mm < 12) return `${mm}m${w}w`;
		let y = Math.floor(mm / 12);
		mm %= 12;
		return `${y}y${mm}m`;
	}
	// convert age string into seconds
	ageSec(a) {
		if (a.includes('Streamed ')) a = a.substr(9);
		if (a.includes('Updated ')) a = a.substr(8);
		if (a.includes('today')) a = '0 days ago';
		let q = parseInt(a.substr(0, 2));
		if (isNaN(q)) return 0;
		if (a.includes('second')) return q;
		if (a.includes('minute')) return 60 * q;
		if (a.includes('hour')) return 60 * 60 * q;
		if (a.includes('day')) return 24 * 60 * 60 * q;
		if (a.includes('week')) return 7 * 24 * 60 * 60 * q;
		if (a.includes('month')) return 52 * 7 * 24 * 60 * 60 * q / 12;
		if (a.includes('year')) return 52 * 7 * 24 * 60 * 60 * q;
		return 0;
	}

	dateTS(s) {
		return Date.parse(`${s} 00:00:00 GMT`);
	}

	// condence large quantities into k,m,b or g
	qFmt(q, g) {
		if ((q === undefined) || (q === null)) return 'n/a';
		if (g === undefined) g = 'b';
		const suffix = ['', 'k', 'm', g, 't'];
		let d = 1000;
		if (g === 'g') d = 1024;
		let c = 0;
		do {
			if (q < 0) return 'n/a';
			if (c) {
				if (q < 10) return q.toFixed(2) + suffix[c];
				if (q < 100) return q.toFixed(1) + suffix[c];
			}
			if (q < 1000) return q.toFixed(0) + suffix[c];
			q /= d;
			c++;
		} while (q > 0.5);
	}

	// convert view quantity string into number
	viewQ(v) {
		if (v === null) return 0;
		if (v === undefined) return 0;
		let vs = v.split(' ');
		let c = 0;
		vs.forEach(e => {
			let s = e.replace(/,/g, '');
			let vc = parseFloat(s);
			if (!isNaN(vc)) {
				c = vc;
				if (e.includes('K')) c *= 1000;
				if (e.includes('M')) c *= 1000000;
				if (e.includes('B')) c *= 1000000000;
			}
		});
		return Math.floor(c);
	}

	secDur(s, x = ':::') {
		let h = Math.floor(s / 3600);
		let m = Math.floor((s - (3600 * h)) / 60);
		if (x[2] === ':') x[2] = '';
		s %= 60;
		if (h) return h + x[0] + (100 + m).toString().substr(1) + x[1] + (100 + s).toString().substr(1) + x[2];
		if (m) return m + x[1] + (100 + s).toString().substr(1) + x[2];
		return `0${x[1]}${(100 + s).toString().substr(1)}${x[2]}`;
	}

	ms2tc(ms) {
		let pad = (n, z = 2) => `00${n}`.slice(-z);
		let msecs = ms % 1000;
		ms = (ms - msecs) / 1000;
		let secs = ms % 60;
		ms = (ms - secs) / 60;
		let mins = ms % 60;
		let hrs = (ms - mins) / 60;
		return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(msecs, 3)}`;
	}

	// convert duration string into seconds
	durSec(v) {
		if (v === undefined) return 0;
		let r = 0;
		let s = v.split(':');
		s.forEach(e => {
			r *= 60;
			r += parseInt(e);
		});
		return r;
	}

	// current timestamp
	now() {
		return Date.now();
	}

	// default user agent strings if none are supplied
	ff() {
		let date = new Date();
		let version = `${((date.getFullYear() - 2018) * 4) + Math.floor(date.getMonth() / 4) + 58}.0`;
		return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version} Gecko/20100101 Firefox/${version}`;
	}

	// returns extracted text from body text using start and end text.
	// include the last snip characters of start text and the first enip characters of end text
	// provide what an empty results looks like
	// optionally truncate the body at the end of the end text.
	pinch(body, start, end, snip, enip, empty, truncate) {
		let extract = empty;
		let spos = body.indexOf(start);
		let slen = start.length;
		if (spos >= 0) {
			let next = body.substr(spos + slen - snip);
			let epos = next.indexOf(end);
			if (epos >= 0) {
				extract = next.substr(0, epos + enip);
				if (truncate) body = body.substr(spos + slen - snip + epos + enip);
			} else {
				extract = body.substr(spos + slen - snip);
				if (truncate) body = '';
			}
		} else if (truncate) { body = ''; }
		return extract;
	}

	// iterates through body from start text less snip characters
	// on an open character it increments level, on a close character it decrements level
	// it ends when level return to zero.
	// provide what an empty results looks like
	// optionally truncate the body at the end of the end text.
	block(body, start, snip, open, close, empty, truncate) {
		let extract = empty;
		let spos = body.indexOf(start);
		let slen = start.length;
		if (spos >= 0) {
			let pos = spos + slen - snip;
			let done = false;
			let level = 0;
			extract = start.substr(0, slen - snip);
			while (!done) {
				switch (body[pos]) {
					case open:
						level++;
						break;
					case close:
						level--;
						if (!level) done = true;
						break;
				}
				extract += body[pos];
				pos++;
				if (pos >= body.length) done = true;
			}
			if (truncate) body = body.substring(0, pos);
		} else if (truncate) { body = ''; }
		return extract;
	}
}

// Initiate the class
function utInit() {
	return new utClass;
}

module.exports = utInit;
