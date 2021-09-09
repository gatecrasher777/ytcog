// ytcog - innertube library - main module
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const Session = require('./session');
const Search = require('./search');
const Channel = require('./channel');
const Playlist = require('./playlist');
const Video = require('./video');
const ut = require('./ut')();

// exclude these fields in the info request
const exclusions = ['type','userAgent','status','transferred','options',
    'expiry','audioStreams','videoStreams','storyBoards','formats','cancelled','isLive','canEmbed','debugOn'];

// quick download object - no persistence required
class Download {

    // constructor requires options {id[,cookie,userAgent,path,filename,container,videoQuality,audioQuality,mediaBitrate]}
    constructor(options,cookie='',userAgent='',debug=false) {
        this.session = new Session(cookie,userAgent);
        this.video = null;
        this.options = options;
        this.debug = debug;
    }

    // fetch the media, report the results
    async fetch() {
        this.session.debugOn=this.debug;
        await this.session.fetch();
        if (this.session.status=='OK') {
            this.video = new Video(this.session,this.options);
            this.video.debugOn=this.debug;
            await this.video.fetch();
            if (this.video.status=='OK') {
                console.log(ut.jsp(this.video.info(exclusions)));
                await this.video.download();
                if (this.video.downloaded) {
                    console.log('\n\nDone!');
                    console.log(`Downloaded: ${this.video.fn}`);
                } else {
                    console.log(`Video status: ${this.video.status} (${this.video.reason})`);
                }
            } else {
                console.log(`Video status: ${this.video.status} (${this.video.reason})`);
            }
        } else {
            console.log(`Session status: ${this.session.status} (${this.session.reason})`);
        }
    }
}

//encapsulate the object classes
const ytcog = {
    Session : Session,
    Search: Search,
    Channel: Channel,
    Playlist: Playlist,
    Video: Video,
    Download: Download,
    dl: async (options,cookie='',userAgent='',debug=false) => {
        let download = new Download(options,cookie,userAgent,debug);
        await download.fetch();
    }
}

module.exports = ytcog;
