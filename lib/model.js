// ytcog - innertube library - abstract base model object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const miniget = require('miniget');
const ut = require('./ut')();
const zlib = require('zlib');
const sanitize = require('sanitize-filename');
const https = require('https');
let ProxyAgent = require('proxy-agent');

// base model, merge options, https protocols
class Model {
	// constructure takes optional cookie andd user agent strings
	constructor(cookie, userAgent, proxy) {
		this.type = 'model';
		this.cookie = '';
		this.userAgent = ut.ff();
		this.proxy = '';
		if (cookie && cookie.length) this.cookie = cookie;
		if (userAgent && userAgent.length) this.userAgent = userAgent;
		if (proxy && proxy.length) this.proxy = proxy;
		this.status = 'NOK';
		this.reason = 'No information received';
		this.common = {
			hostname: 'www.youtube.com',
			path: '/',
			port: 443,
			headers: {
				'content-type': 'text/html',
				origin: 'https://www.youtube.com',
				referer: 'https://www.youtube.com/',
				'user-agent': this.userAgent,
			},
			maxRedirects: 5,
			maxRetries: 3,
			maxReconnects: 3,
			backoff: { inc: 500, max: 10000 },
		};
		if (this.proxy.length) this.common.agent = new ProxyAgent(process.env.http_proxy || this.proxy);
		this.zip = null;
		this.transferred = 0;
		this.compress = {
			gzip: () => { this.zip = zlib.createGunzip(); return this.zip; },
			deflate: () => { this.zip = zlib.createDeflate(); return this.zip; },
			br: () => { this.zip = zlib.createBrotliDecompress(); return this.zip; },
		};
		this.data = {};
		this.options = {};
		this.sapisid = '';
		if (this.cookie.length) {
			this.common.headers.cookie = cookie;
			this.sapisid = ut.pinch(this.cookie, 'SAPISID=', ';', 0, 0, '', false);
		}
		this.debugOn = false;
	}

	// merge options
	combine(method, options, compress) {
		let hdrs, opts;
		options.headers ? hdrs = { ...this.common.headers, ...options.headers } : hdrs = this.common.headers;
		opts = { ...this.common, ...options };
		opts.method = method;
		opts.headers = hdrs;
		if (compress) {
			opts.acceptEncoding = this.compress;
			opts.headers['accept-encoding'] = 'gzip, deflate, br';
		}
		return opts;
	}

	// manage post requests to url with options, data and whether to use compression.
	async httpsPost(url, postOptions, postData, compress) {
		let body;
		try {
			let opts = this.combine('POST', postOptions, compress);
			let req = miniget(url, opts);
			let uncompressed = 0;
			let compressed = 0;
			req.once('request', ar => {
				ar.write(postData);
			});
			req.on('data', chunk => {
				uncompressed += chunk.length;
			});
			body = await req.text();
			if (this.zip !== null) compressed = this.zip.bytesWritten;
			compressed ? this.transferred += compressed : this.transferred += uncompressed;
			this.status = 'OK';
			this.reason = '';
		} catch (e) {
			this.debug(e);
			this.status = 'NOK';
			this.reason = `Post request error. Status Code: ${e.statuscode}`;
		}
		return body;
	}

	// manage get requests to url with options and whether to use compression.
	async httpsGet(url, getOptions, compress) {
		let body;
		try {
			let uncompressed = 0;
			let compressed = 0;
			let opts = this.combine('GET', getOptions, compress);
			let req = miniget(url, opts);
			req.on('data', chunk => {
				uncompressed += chunk.length;
			});
			body = await req.text();
			if (this.zip !== null) compressed = this.zip.bytesWritten;
			compressed ? this.transferred += compressed : this.transferred += uncompressed;
			this.status = 'OK';
			this.reason = '';
		} catch (e) {
			this.debug(e);
			this.status = 'NOK';
			this.reason = `Get request error. Status Code: ${e.statuscode}`;
		}
		return body;
	}

	// manage head requests to check status on online resource
	async httpsHead(url) {
		return new Promise((resolve, reject) => {
			https.request(url, { method: 'HEAD' }, res => {
				if ([403, 404].includes(res.statusCode)) {
					this.status = 'NOK';
					this.reason = `video is offline. Status code: ${res.statusCode}`;
				} else {
					this.status = 'OK';
					this.reason = '';
				}
				resolve(res.statusCode);
			}).on('error', err => {
				this.status = 'NOK';
				this.reason = err.message;
				reject(err);
			}).end();
		});
	}

	// update options object with new options
	updateOptions(newOptions) {
		this.options = { ...this.options, ...newOptions };
	}

	// return a human readable object of class properties where ignore is an array of property names to ignore
	info(ignore = []) {
		let always = ['data', 'session', 'player', 'results', 'videos', 'playlists', 'channels',
			'zip', 'common', 'spmap', 'compress', 'more'];
		let exclude = [...new Set([...always, ...ignore])];
		try {
			let props = Object.keys(this);
			let meta = {};
			props.forEach(k => {
				if (!exclude.includes(k)) {
					switch (typeof this[k]) {
						case 'boolean':
							meta[k] = this[k];
							break;
						case 'string':
							if (this[k].length) {
								meta[k] = this[k];
							}
							break;
						case 'number':
							if (this[k] > 0) {
								if (['published', 'updated', 'downloaded', 'joined', 'profiled', 'latest'].includes(k)) {
									meta[k] = `${ut.tsAge(this[k])} ago`;
									if (meta[k] === 'now ago') meta[k] = 'now';
								} else {
									meta[k] = this[k];
								}
							}
							break;
						case 'function': break;
						case 'object':
							if (Array.isArray(this[k]) && this[k].length) {
								meta[k] = this[k];
							} else if (this[k] && Object.keys(this[k]).length) {
								meta[k] = this[k];
							}
							break;
						default:
							break;
					}
				}
			});
			return meta;
		} catch (e) {
			this.debug(e);
			return {
				error: e,
			};
		}
	}

	filename(fn) {
		let s = '';
		let dol = false;
		let lev = 0;
		let inp = fn.split('');
		let tag = '';

		const extract = o => {
			switch (typeof o) {
				case 'boolean': return o.toString();
				case 'string': return o;
				case 'number': return o.toString();
				case 'object':
					if (Array.isArray(o) && o.length && (typeof o[0] === 'string')) return o.join(',');
					break;
				default:
					break;
			}
		};
		inp.forEach(c => {
			let acc = () => {
				lev ? tag += c : s += c;
				dol = false;
			};
			switch (c) {
				case '$':
					dol = true;
					break;
				case '{':
					if (dol) {
						lev++;
						dol = false;
					} else { acc(); }
					break;
				case '}':
					if (lev) {
						if (tag.length) {
							if (['date', 'datetime', 'timestamp'].includes(tag)) {
								let p = ut.now();
								if ((this.type === 'video') && this.published) p = this.published;
								s += ut[`ts2${tag}`](p);
							} else if (this[tag] !== undefined) {
								s += extract(this[tag]);
							} else if ((this.options !== undefined) && (this.options[tag] !== undefined)) {
								s += extract(this.options[tag]);
							}
						}
						lev--;
						tag = '';
						dol = false;
					} else { acc(); }
					break;
				default:
					lev ? tag += c : s += c;
					dol = false;
					break;
			}
		});
		return sanitize(s);
	}

	add(item) {
		let a = this[`${item.type}s`];
		if (!a.find(e => e.id === item.id)) a.push(item);
	}

	debug(e) {
		if (this.debugOn) console.log(e);
	}
}

module.exports = Model;
