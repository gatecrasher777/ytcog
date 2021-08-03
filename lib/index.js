// ytcog - innertube library - main module
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const Session = require('./session');
const Player = require('./player');
const Search = require('./search');
const Channel = require('./channel');
const Video = require('./video');
const ut = require('./ut')();

const exclusions = ['audioStreams,videoStreams,storyBoards'];

class Download {
    constructor(options) {
        this.session = new Session(options.cookie,options.userAgent);
        this.video = null;
        this.options = options;
    }

    async fetch() {
        await this.session.fetch();
        if (this.session.status=='OK') {
            this.video = new Video(this.session,this.options);
            await this.video.fetch();
            if (this.video.status='OK') {
                console.log(ut.jsp(this.video.info([exclusions])))
                await this.video.download();
                if (this.downloaded) {
                    console.log('\n\nDone!');
                } else {
                    console.log(`Video status: ${video.status} (${video.reason})`);
                }
            } else {
                console.log(`Video status: ${video.status} (${video.reason})`);
            }
        } else {
            console.log(`Session status: ${session.status} (${session.reason})`);
        }
    }
}

const ytcog = {
    Session : Session,
    Player : Player,
    Search: Search,
    Channel: Channel,
    Video: Video,
    Download: Download,
    dl: async (options) => {
        let download = new Download(options);
        download.fetch();
    }
}

module.exports = ytcog;
