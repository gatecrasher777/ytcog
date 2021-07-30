// ytcog - innertube library - abstract base model object class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const miniget = require('miniget');
const ut = require('./ut.js')();
const zlib = require('zlib');

class Model {
	
	constructor(cookie,userAgent) {
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
		this.compress = { 
				gzip: () => { zlib.createGunzip(); },
				deflate: () => { zlib.createDeflate(); },
				br: () => { zlib.createBrotliDecompress(); }
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

	combine(method,options,compress) {
		let hdrs,opts;
		(options.headers) ? hdrs = { ...this.common.headers, ...options.headers } : hdrs = this.common.headers;
		opts = {...this.common ...options}
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
			let req = miniget(url,combine('POST',postOptions,compress));
			req.once('request',(ar) => {
				ar.write(postData);
			});
			body = await req.text();
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			this.status = 'NOK';
			this.reason =  `Post request error. Status Code: ${e.statuscode}`;	
		}
		return body;
	}

	async httpsGet(url,getOptions,compress) {  
		let body;
		try {
			body = await miniget(url,combine('GET',getOptions,compress)).text();
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
			await miniget(url,combine('HEAD',headOptions,false)).text();
			this.status = 'OK';
			this.reason = '';
		} catch(e) {
			this.status = 'NOK';
			this.reason = `Head request error. Status Code: ${e.statuscode}`;
		}
	}

	updateOptions(newOptions) {
		this.options = {...this.options ...newOptions} ;
	}

}

module.exports=Model;
