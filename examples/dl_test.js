// ytcog - innertube library - example to test quick download
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');

// User editable data:
let app = {
	downloaded: 0,
	// supply browser youtube cookie
	cookie: '',
	// supply browser user agent
	userAgent: '',
	// proxy agent string
	proxy: '',
	debug: true,
	options: {
		// any video id, mandatory propery
		id: 'UoHEvzQc0O4',
		// optional published timestamp
		published: 0,
		// supply a download folder for downloaded video
		path: './examples',
		// supply a optional filename, do not include an extension. default filename is author_title_videoId_format.ext
		filename: '${author}_${datetime}_${title}_${id}_${videoQuality}_${videoCodec}_${audioCodec}',
		// any, mp4, webm, mkv
		container: 'any',
		// desired quality: highest, 1080p, 720p, 480p, medium, 360p, 240p, 144p, lowest, none
		videoQuality: '1080p',
		// desired audio quality: high, medium, low, none
		audioQuality: 'medium',
		// for streams of equal resolution/quality pick the highest or lowest bitrate.
		mediaBitrate: 'highest',
		// Specific video format (-1 use above options to rank video streams)
		videoFormat: -1,
		// Specific audio format (-1 use above options to rank audio streams)
		audioFormat: -1,
		// Metadata to add to downloaded media
		metadata: 'author,title,published',
		// supply a callback for download progress;
		progress: (prg, siz, tot) => {
			app.downloaded += siz;
			process.stdout.write(`Progress ${Math.floor(prg)}% - ${app.downloaded}/${tot}   \r`);
		},
		// overwrite existing downloads yes/no
		overwrite: 'yes',
	},
};

async function run() {
	await ytcog.dl(
		app.options,
		app.cookie,
		app.userAgent,
		app.proxy,
		app.debug,
	);
}

if (process.argv.length === 2) {
	run();
} else if (process.argv.length === 3) {
	app.options.id = process.argv[2];
	run();
} else {
	console.log('usage: >node /examples/video_test [id]');
}
