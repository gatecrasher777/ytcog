// ytcog - innertube library - video download module - run as a fork
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytfomo
// MIT Licenced

const fs = require('fs');
const miniget = require('miniget');
const spawn = require('child_process').spawnSync;
const ut = require('./ut.js')();
const ffmpeg = require('ffmpeg-static');

let dl;
let interval;

function send(msg) {
    if (process.send) process.send(msg);
}

class Download {

    constructor(data) { 
        this.attempt = 0;
        this.logging = data.logging;
        this.cancelled = false;
        this.timeout = 60000;
        this.maxChunk = 0;
        this.curChunk = 0;
        this.data = data;
        this.opts = {
            headers: {
                'origin': 'https://www.youtube.com',
                'referer': 'https://www.youtube.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36'
            },
            maxReconnects: 5, 
            maxRetries: 4, 
            backoff: { inc: 600, max: 12000 },
            highWaterMark: 1024*1024,
        };
        this.split = 0;
        this.elapsed = 0;
        this.transferred = 0;
        this.progress = 0;
        this.type = '';
        this.vws = null;
        this.vrs = null;
        this.aws = null;
        this.ars = null;
        this.tmo = null;
        this.vfn = this.data.dlpath+'/'+this.data.id+'_video_v'+this.data.vformat+'.'+this.data.stream.container;
        this.afn = this.data.dlpath+'/'+this.data.id+'_audio_a'+this.data.aformat+'.'+this.data.stream.container;
        this.attempt++;
        switch (this.data.stream.mode) {
            case 'vonly':
                this.vdownload();
            break;
            case 'aonly':
                this.adownload();
            break;
            default: 
                this.adownload();
            break;
        }
    }

    unlink(msg) {
        fs.unlink(this.afn, (err) => {    
            fs.unlink(this.vfn,(err)=>{
                this.send(msg);
            });
        });
    }

    failed(msg) {
        if (this.aws !== null) this.aws.destroy();
        if (this.ars !== null) this.ars.destroy();
        if (this.vws !== null) this.vws.destroy();
        if (this.vrs !== null) this.vrs.destroy();
        this.unlink(msg);
    }

    timedOut() {
        this.failed({msg:'failed', fail: this.type, reason:'timed out', attempt: this.attempt});
    }

    dataChunk(chunk) {
        clearTimeout(this.tmo);
        if ((!isNaN(chunk.length)) && (this.data.stream.size)) {
            if (this.split) {
                let oldSplit = this.split;
                this.split = ut.now();
                this.elapsed += (this.split - oldSplit);
            } else {
               this.split = ut.now(); 
            }  
            this.transferred += chunk.length;
            this.progress = 100*this.transferred/this.data.stream.size;
            this.send({msg:'progress', prg: this.progress, siz:chunk.length});
        }
        if (this.cancelled) {
            this.failed({msg:'cancelled', fail: this.type, reason: 'cancelled'});
        } else {
            this.tmo = setTimeout(this.timedOut.bind(this), this.timeout);
        }
    }

    dataError(error) {
        clearTimeout(this.tmo);
        this.send({msg:'error',err:error});
        switch (error.statusCode) {
            case 403:
            case 404: this.failed({msg:'failed',fail: this.type, reason:error.statusCode});
            break;
            default: this.tmo = setTimeout(this.timedOut.bind(this), this.timeout);
            break;
        }
    }

    dataAudioEnd() {
        clearTimeout(this.tmo);
        if (this.curChunk >= this.maxChunk) {
            if (this.data.stream.mode == 'v&a') {
                this.vdownload();
            } else {
                fs.rename(this.afn,this.data.fn,(err)=>{
                    this.send({msg:'completed'});
                });
            }
        } else {
            this.curChunk++;
            this.nextAudioChunk();
        }
    }

    dataVideoEnd() { 
        clearTimeout(this.tmo);
        if (this.curChunk >= this.maxChunk) {
            if (this.data.stream.mode == 'v&a') {
                let output = spawn(ffmpeg,['-i',this.vfn,'-i',this.afn,'-map','0:v:0','-map','1:a:0','-vcodec','copy','-acodec','copy',this.data.fn]);
                if (fs.existsSync(this.data.fn)) {
                    this.unlink({msg:'completed'});
                } else {
                    fs.rename(this.afn,this.data.fn+'.audio',(err)=>{
                        fs.rename(this.vfn,this.data.fn+'.video',(err)=>{
                            this.send({msg:'completed'});
                        });
                    });
                }
            } else {
                fs.rename(this.vfn,this.data.fn,(err)=>{
                    this.send({msg:'completed'});
                });
            }
        } else {
            this.curChunk++;
            this.nextVideoChunk();
        }
    }

    nextVideoChunk() {
        if (!this.cancelled) {
            if (this.maxChunk) {
                let start = this.curChunk*1024*1024*10;
                if (this.curChunk == this.maxChunk) {
                    this.opts.headers['Range'] =`bytes=${start}-`;
                } else {
                    let end = start+1024*1024*10-1;
                    this.opts.headers['Range'] =`bytes=${start}-${end}`;
                }
            } else {
                delete this.opts.headers['Range'];
            }
            this.vrs = miniget(this.data.stream.video_url,this.opts);
            this.vrs.pipe(this.vws,{end:(this.curChunk == this.maxChunk)});
            this.vrs.on('data',this.dataChunk.bind(this));
            this.vrs.on('error',this.dataError.bind(this));
            this.vrs.on('end',this.dataVideoEnd.bind(this));
        }
    }

    vdownload() {
        this.type = 'video';
        this.vws = fs.createWriteStream(this.vfn);
        if (this.data.stream.asize == -1) { //combined video/audio stream - do not chunk
          this.maxchunk = 0;
        } else {
          this.maxChunk = Math.floor(this.data.stream.vsize/1024/1024/10);
        }
        this.curChunk = 0;
        this.nextVideoChunk();
    }

    nextAudioChunk() {
        if (!this.cancelled) {
            if (this.maxChunk) {
                let start = this.curChunk*1024*1024*1;
                if (this.curChunk == this.maxChunk) {
                    this.opts.headers['Range'] =`bytes=${start}-`;
                } else {
                    let end = start+1024*1024*1-1;
                    this.opts.headers['Range'] =`bytes=${start}-${end}`;
                }
            } else {
                delete this.opts.headers['Range'];
            }
            this.ars = miniget(this.data.stream.audio_url,this.opts);
            this.ars.pipe(this.aws,{end:(this.curChunk == this.maxChunk)});
            this.ars.on('data',this.dataChunk.bind(this));
            this.ars.on('error',this.dataError.bind(this));
            this.ars.on('end',this.dataAudioEnd.bind(this));
        }
    }

    adownload() {
        this.type = 'audio';
        this.aws = fs.createWriteStream(this.afn);
        this.maxChunk = Math.floor(this.data.stream.asize/1024/1024/1);
        this.curChunk = 0;
        this.nextAudioChunk();
    }

    done() {
        process.exit(0);
    }

    cancel() {
        this.cancelled = true;
    }

    send(msg) {
        send(msg);
    }

    timewait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async retry(ms) {
        await this.timewait(ms);
        this.elapsed = 0;
        this.split = 0;
        this.progress = 0;
        this.transferred = 0;
        this.type = '';
        this.vws = null;
        this.vrs = null;
        this.aws = null;
        this.ars = null;
        this.tmo = null;
        this.attempt++;
        switch (this.data.stream.mode) {
            case 'vonly':
                this.vdownload();
            break;
            case 'aonly':
                this.adownload()
            break;
            default: 
                this.adownload()
            break;
        }
    }

};

process.on('message', (msg) => {
    switch (msg.msg) {
        case 'retry':
            dl.retry(30000);
        break;
        case 'download' : 
            dl = new Download(msg.data); 
        break;
        case 'cancel' : 
            if (dl !== undefined) dl.cancel(); 
        break;
        case 'done' : 
            if (dl !==undefined) dl.done(); 
            clearInterval(interval); 
        break;
        default: break;
    }
});

if ((process.argv.length==2) && (process)) {
    send({msg:'ready'});
    interval = setInterval( () => {} , 60000);
}
