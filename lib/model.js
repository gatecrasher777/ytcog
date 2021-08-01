// ytcog - innertube library - abstract base model object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const miniget = require('miniget');
const ut = require('./ut')();
const zlib = require('zlib');

class Model {
	
	constructor(cookie,userAgent) {
		this.type = 'model';
		this.cookie = cookie;
		this.userAgent = userAgent;
		this.status = 'NOK';
		this.reason = 'No information received';
		this.common = {
			hostname: 'www.youtube.com',
			path: '/',
			port: 443,
			headers: {
				'content-type': 'text/html',
				'origin': 'https://www.youtube.com',
				'referer': 'https://www.youtube.com/',
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36',
			},
			maxRedirects: 5,
			maxRetries: 3,
			maxReconnects: 3,
			backoff: { inc: 500, max: 10000 },			
		};
		this.zip;
		this.compress = { 
			gzip: () => { this.zip = zlib.createGunzip(); return this.zip; },
			deflate: () => { this.zip = zlib.createDeflate(); return this.zip; },
			br: () => { this.zip = zlib.createBrotliDecompress(); return this.zip; }
		}
		this.data = {};
		this.options = {};
		if (this.userAgent.length) this.common.headers['user-agent'] = userAgent;
		this.sapisid = '';
		if (this.cookie.length) {
			this.common.headers.cookie = cookie;
			this.sapisid = ut.pinch(this.cookie,'SAPISID=',';',0,0,'',false);
		}
	}

	#combine(method,options,compress) {
		let hdrs,opts;
		(options.headers) ? hdrs = { ...this.common.headers, ...options.headers } : hdrs = this.common.headers;
		opts = { ...this.common, ...options}
		opts.method = method;
		opts.headers = hdrs;
		if (compress) {
			opts.acceptEncoding = this.compress;
			opts.headers['accept-encoding'] = 'gzip, deflate, br';
		}
		return opts;
	}

	async httpsPost(url,postOptions,postData,compress) {  
		let body;
		try {
			let opts = this.#combine('POST',postOptions,compress);
			let req = miniget(url,opts);
			req.once('request',(ar) => {
				ar.write(postData);
			});
			body = await req.text();
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			console.log(e);
			this.status = 'NOK';
			this.reason =  `Post request error. Status Code: ${e.statuscode}`;	
		}
		return body;
	}

	async httpsGet(url,getOptions,compress) {  
		let body;
		try {
			let opts = this.#combine('GET',getOptions,compress);
			body = await miniget(url,opts).text();
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			this.status = 'NOK';
			this.reason = `Get request error. Status Code: ${e.statuscode}`;
		}
		return body;
	}

	async httpsHead(url,headOptions) { 
		try {
			await miniget(url,this.#combine('HEAD',headOptions,false)).text();
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			this.status = 'NOK';
			this.reason = `Head request error. Status Code: ${e.statuscode}`;
		}
	}

	updateOptions(newOptions) {
		this.options = {...this.options, ...newOptions} ;
	}

	info(ignore=[]) {
		let always = ['data','session','player','videos','zip','common','spmap','compress'];
		let exclude = [...new Set([...always ,...ignore])]
		try{
			let props = Object.keys(this);
			let meta = {};
			props.forEach((k)=>{
				if (!exclude.includes(k)) {
					switch (typeof this[k]) {
						case 'boolean':
							meta[k]=this[k];
							break;
						case 'string':
							if (this[k].length) {
								meta[k]=this[k];
							}
							break;
						case 'number':
							if (this[k]>0) {
								if (['published','updated','downloaded','joined','profiled','latest'].includes(k)) {
									meta[k]=ut.tsAge(this[k])+' ago'; 
								} else {
									meta[k]=this[k];
								}
							}
							break;
						case 'function': break;
						case 'object':
							if ((Array.isArray(this[k])) && (this[k].length)) {
								meta[k]=this[k];
							} else if ((this[k]) && (Object.keys(this[k]).length)) {
								meta[k]=this[k];
							} 
							break;
						default: 
						break;
					}
				}
			});
			return meta;
		} catch(e) {
			console.log(e);
			return {
				error: e
			};
		}
	}

}

module.exports=Model;
