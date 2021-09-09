// ytcog - innertube library - video download module - run as a fork
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytfomo
// MIT Licenced

const fs = require('fs');
const miniget = require('miniget');
const spawn = require('child_process').spawnSync;
const ut = require('./ut.js')();
const ffmpeg = require('ffmpeg-static');

// download instance
let dl;
// keepalive interval
let interval;

// send message to parent process
function send(msg) {
    if (process.send) process.send(msg);
}

// download object manages a specific download attempt 
class Download {

    // constructs a download object, requires a data stream object 
    constructor(data) { 
        this.attempt = 0;
        this.logging = data.logging;
        this.cancelled = false;
        this.timeout = 60000;
        this.maxSection = 0;
        this.curSection = 0;
        this.data = data;
        this.opts = {
            headers: {
                'origin': 'https://www.youtube.com',
                'referer': 'https://www.youtube.com/',
                'user-agent': data.agent
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
        this.aSize = 2; //mb sections
        this.vSize = 8; //mb sections
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

    // delete temporary files
    unlink(msg) {
        fs.unlink(this.afn, (err) => {    
            fs.unlink(this.vfn,(err)=>{
                this.send(msg);
            });
        });
    }

    // cleanup failed download
    failed(msg) {
        if (this.aws !== null) this.aws.destroy();
        if (this.ars !== null) this.ars.destroy();
        if (this.vws !== null) this.vws.destroy();
        if (this.vrs !== null) this.vrs.destroy();
        this.unlink(msg);
    }

    // download timed out
    timedOut() {
        this.failed({msg:'failed', fail: this.type, reason:'timed out', attempt: this.attempt});
    }

    // report progress and check cancelled status after each data chunk is received
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

    // process server errors
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

    // add metadata and output filename to ffmpeg args
    ffmpegArgs(args) {
        this.data.metadata.forEach((m) => {
            args.push('-metadata');
            args.push(`${m.field}=${m.value}`);
        });
        args.push('-y');
        args.push(this.data.fn);
        return args;
    }

    // check if the audio download is completed
    dataAudioEnd() {
        clearTimeout(this.tmo);
        if (this.curSection >= this.maxSection) {
            if (this.data.stream.mode == 'v&a') {
                this.vdownload();
            } else {
                let output = spawn(
                    ffmpeg,
                    this.ffmpegArgs(['-i',this.afn,'-map','1:a:0','-acodec','copy'])
                )
                if (fs.existsSync(this.data.fn)) {
                    this.unlink({msg:'completed'});
                } else { //ffmpeg failed
                    fs.rename(this.afn,this.data.fn,(err)=>{
                        this.send({msg:'completed'});
                    });
                }
            }
        } else {
            this.curSection++;
            this.nextAudioSection();
        }
    }

    // check if the video download is completed, join audio and video if required
    dataVideoEnd() { 
        clearTimeout(this.tmo);
        if (this.curSection >= this.maxSection) {
            if (this.data.stream.mode == 'v&a') {
                let output = spawn(
                    ffmpeg,
                    this.ffmpegArgs(['-i',this.vfn,'-i',this.afn,'-map','0:v:0','-map','1:a:0','-vcodec','copy','-acodec','copy'])
                );
                if (fs.existsSync(this.data.fn)) {
                    this.unlink({msg:'completed'});
                } else { //ffmpeg failed
                    fs.rename(this.afn,this.data.fn+'.audio',(err)=>{
                        fs.rename(this.vfn,this.data.fn+'.video',(err)=>{
                            this.send({msg:'completed'});
                        });
                    });
                }
            } else {
                let output = spawn(
                    ffmpeg,
                    this.ffmpegArgs(['-i',this.vfn,'-map','0:v:0','-vcodec','copy'])
                );
                if (fs.existsSync(this.data.fn)) {
                    this.unlink({msg:'completed'});
                } else { //ffmpeg failed
                    fs.rename(this.vfn,this.data.fn,(err)=>{
                        this.send({msg:'completed'});
                    });
                }
            }
        } else {
            this.curSection++;
            this.nextVideoSection();
        }
    }

    // download the next section of video
    nextVideoSection() {
        if (!this.cancelled) {
            if (this.maxSection) {
                let start = this.curSection*1024*1024*this.vSize;
                if (this.curSection == this.maxSection) {
                    this.opts.headers['Range'] =`bytes=${start}-`;
                } else {
                    let end = start+1024*1024*this.vSize-1;
                    this.opts.headers['Range'] =`bytes=${start}-${end}`;
                }
            } else {
                delete this.opts.headers['Range'];
            }
            this.vrs = miniget(this.data.stream.video_url,this.opts);
            this.vrs.pipe(this.vws,{end:(this.curSection == this.maxSection)});
            this.vrs.on('data',this.dataChunk.bind(this));
            this.vrs.on('error',this.dataError.bind(this));
            this.vrs.on('end',this.dataVideoEnd.bind(this));
        }
    }

    // download video, determine number of sections keeping each section <= vSize MB
    vdownload() {
        this.type = 'video';
        this.vws = fs.createWriteStream(this.vfn);
        if (this.data.stream.asize == -1) { //combined video/audio stream - do not section
          this.maxSection = 0;
        } else {
          this.maxSection = Math.floor(this.data.stream.vsize/1024/1024/this.vSize);
        }
        this.curSection = 0;
        this.nextVideoSection();
    }

    // download the next section of audio
    nextAudioSection() {
        if (!this.cancelled) {
            if (this.maxSection) {
                let start = this.curSection*1024*1024*this.aSize;
                if (this.curSection == this.maxSection) {
                    this.opts.headers['Range'] =`bytes=${start}-`;
                } else {
                    let end = start+1024*1024*this.aSize-1;
                    this.opts.headers['Range'] =`bytes=${start}-${end}`;
                }
            } else {
                delete this.opts.headers['Range'];
            }
            this.ars = miniget(this.data.stream.audio_url,this.opts);
            this.ars.pipe(this.aws,{end:(this.curSection == this.maxSection)});
            this.ars.on('data',this.dataChunk.bind(this));
            this.ars.on('error',this.dataError.bind(this));
            this.ars.on('end',this.dataAudioEnd.bind(this));
        }
    }

    // download audio, determine the number of sections keeping each section <= aSize MB
    adownload() {
        this.type = 'audio';
        this.aws = fs.createWriteStream(this.afn);
        this.maxSection = Math.floor(this.data.stream.asize/1024/1024/this.aSize);
        this.curSection = 0;
        this.nextAudioSection();
    }

    // exit the module
    done() {
        process.exit(0);
    }

    // cancel the download
    cancel() {
        this.cancelled = true;
    }

    // send a message to parent process
    send(msg) {
        send(msg);
    }

    // wait ms milliseconds
    timewait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // retry the download
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

// receive messages from the parent process, create the Download object
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

// this module takes no arguments and requires a parent process, it is kept alive
if ((process.argv.length==2) && (process)) {
    send({msg:'ready'});
    interval = setInterval( () => {} , 60000);
}
