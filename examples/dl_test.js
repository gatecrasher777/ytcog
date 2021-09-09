// ytcog - innertube library - example to test quick download
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');

//User editable data:
let test_options = {
    id: 'UoHEvzQc0O4', //any video id, mandatory propery
    cookie: '',  //supply browser youtube cookie
    userAgent: '', //supply browser user agent
    published: 0, //optional published timestamp
    path: './examples', //supply a download folder for downloaded video
    filename: '${author}_${datetime}_${title}_${id}_${videoQuality}_${videoCodec}_${audioCodec}', //supply a optional filename, do not include an extension. default filename is author_title_videoId_format.ext
    container: 'mkv',  //any, mp4, webm, mkv 
    videoQuality: '1080p', //desired quality: highest, 1080p, 720p, 480p, medium, 360p, 240p, 144p, lowest
    audioQuality: 'medium', //desired audio quality: high, medium, low
    mediaBitrate: 'highest', //for streams of equal resolution/quality pick the highest or lowest bitrate.
    videoFormat: -1, //Specific video format (-1 use above options to rank video streams)
    audioFormat: -1, //Specific audio format (-1 use above options to rank audio streams)
    metadata: 'author,title,published', //Metadata to add to downloaded media
    progress: (prg,siz)=>{  //supply a callback for download progress;
        process.stdout.write(`Progress ${Math.floor(prg)}%\r`);
    }
}

async function run() {
    await ytcog.dl(test_options,true);
}

if (process.argv.length==2) {
    run();
} else if (process.argv.length==3) {
    test_options.id = process.argv[2];
    run();
} else {
    console.log('usage: >node /examples/video_test [id]');
}