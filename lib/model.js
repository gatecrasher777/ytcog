// ytcog - innertube library - abstract base model object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const miniget = require('miniget');
const ut = require('./ut')();
const zlib = require('zlib');

//base model, merge options, https protocols 
class Model {
	
	// constructure takes optional cookie andd user agent strings
	constructor(cookie,userAgent) {
		this.type = 'model';
		this.cookie = '';
		if ((cookie) && (cookie.length)) this.cookie = cookie;
		this.userAgent = ut.ff();
		if ((userAgent) && (userAgent.length)) this.userAgent = userAgent;
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
				'user-agent': this.userAgent,
			},
			maxRedirects: 5,
			maxRetries: 3,
			maxReconnects: 3,
			backoff: { inc: 500, max: 10000 },			
		};
		this.zip = null;
		this.transferred = 0;
		this.compress = { 
			gzip: () => { this.zip = zlib.createGunzip(); return this.zip; },
			deflate: () => { this.zip = zlib.createDeflate(); return this.zip; },
			br: () => { this.zip = zlib.createBrotliDecompress(); return this.zip; }
		}
		this.data = {};
		this.options = {};
		this.sapisid = '';
		if (this.cookie.length) {
			this.common.headers.cookie = cookie;
			this.sapisid = ut.pinch(this.cookie,'SAPISID=',';',0,0,'',false);
		}
	}

	// merge options
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

	// manage post requests to url with options, data and whether to use compression.
	async httpsPost(url,postOptions,postData,compress) {  
		let body;
		try {
			let opts = this.#combine('POST',postOptions,compress);
			let req = miniget(url,opts);
			let uncompressed = 0;
			let compressed = 0;
			req.once('request',(ar) => {
				ar.write(postData);
			});
			req.on('data', (chunk) =>{
				uncompressed += chunk.length;
			});
			body = await req.text();
			if (this.zip !== null) compressed = this.zip.bytesWritten;
			(compressed) ? this.transferred += compressed : this.transferred += uncompressed;
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			console.log(e);
			this.status = 'NOK';
			this.reason =  `Post request error. Status Code: ${e.statuscode}`;	
		}
		return body;
	}

	// manage get requests to url with options and whether to use compression.
	async httpsGet(url,getOptions,compress) {  
		let body;
		try {
			let uncompressed = 0;
			let compressed = 0;
			let opts = this.#combine('GET',getOptions,compress);
			let req = miniget(url,opts);
			req.on('data', (chunk) =>{
				uncompressed += chunk.length;
			});
			body = await req.text();
			if (this.zip !== null) compressed = this.zip.bytesWritten;
			(compressed) ? this.transferred += compressed : this.transferred += uncompressed;
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			this.status = 'NOK';
			this.reason = `Get request error. Status Code: ${e.statuscode}`;
		}
		return body;
	}

	// manage head requests to check status on online resource
	async httpsHead(url) { 
		try {
			let headOptions = {
				method: 'HEAD',
				headers: {
					'origin': 'https://www.youtube.com',
					'referer': 'https://www.youtube.com/',
					'user-agent': this.userAgent,
				},
				maxRedirects: 1,
				maxRetries: 0,
				maxReconnects: 3,
				backoff: { inc: 500, max: 10000 }
			}
			await miniget(url,headOptions).text();
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			this.status = 'NOK';
			this.reason = `Head request error. Status Code: ${e.statusCode}`;
		}
	}

	// update options object with new options
	updateOptions(newOptions) {
		this.options = {...this.options, ...newOptions} ;
	}

	// return a human readable object of class properties where ignore is an array of property names to ignore
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
									if (meta[k] == 'now ago') meta[k] = 'now';
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
