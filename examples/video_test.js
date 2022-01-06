// ytcog - innertube library - example to test channel class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');
const ut = require('../lib/ut.js')();
const fs = require('fs');

// User editable data:
let app = {
	downloaded: 0,
	// logged-in cookie string
	cookie: '',
	// browser user agent
	userAgent: '',
	// proxy agent string
	proxy: '',
	// info fields to ignore
	ignore: ['cookie', 'userAgent', 'options', 'sapisid', 'status', 'reason', 'cancelled'],
	// video options
	test_options: {
		// any video id
		id: '5qwDrjTinMk',
		// optional published timestamp
		published: 0,
		// supplay a download folder for downloaded video
		path: './examples',
		// supply a optional filename, with placeholders, but do not include an extension.
		filename: '${author}_${datetime}_${title}_${id}_${videoQuality}_${videoCodec}_${audioCodec}',
		// any, mp4, webm, mkv
		container: 'any',
		// desired quality: highest, 1080p, 720p, 480p, medium, 360p, 240p, 144p, lowest
		videoQuality: '1080p',
		// desired audio quality: highest, medium, lowest
		audioQuality: 'medium',
		// for streams of equal resolution/quality pick the highest or lowest bitrate.
		mediaBitrate: 'highest',
		// Specific video format (-1 use above options to rank video streams)
		videoFormat: -1,
		// Specific audio format (-1 use above options to rank audio streams)
		audioFormat: -1,
		// Metadata to add to downloaded media
		metadata: 'author,title,published',
		// make srt subtitles if captions are available, chose language codes, comma separated
		subtitles: 'en,es,ja',
		// supply a callback for download progress;
		progress: (prg, siz, tot) => {
			app.downloaded += siz;
			process.stdout.write(`Progress ${Math.floor(prg)}% - ${app.downloaded}/${tot} bytes  \r`);
		},
		// whether existing files are overwritten
		overwrite: 'yes',
	},
	comment_options: {
		order: 'top',
		quantity: 60,
		replies: true,
		filename: '${author}_${datetime}_${title}_${id}_comments',
	},
};

async function run() {
	let session = new ytcog.Session(app.cookie, app.userAgent, app.proxy);
	await session.fetch();
	console.log(`Session status: ${session.status} (${session.reason})`);
	if (session.status === 'OK') {
		let video = new ytcog.Video(session, app.test_options);
		video.debugOn = true;
		console.log('\nFetch video metadata and streams');
		await video.fetch();
		console.log(`Video status: ${video.status} (${video.reason})`);
		if (video.status === 'OK') {
			console.log('\nVideo info saved to ./examples/video_info.json');
			let output = video.info(app.ignore);
			fs.writeFileSync('./examples/video_info.json', ut.jsp(output), 'utf8');
			console.log('Video json to ./examples/video.json');
			fs.writeFileSync('./examples/video.json', ut.jsp(video.data), 'utf8');
			console.log('\nAvailable media streams:');
			console.log(video.streamInfo);
			console.log(`\nStreams expire in ${ut.secDur(video.timeToExpiry, 'hms')}`);
			console.log(video.captions);
			console.log('\nDownloading comments (if available)');
			if (await video.hasComments()) {
				console.log(`Number of Comments: ${video.commentCount}`);
				await video.commentsText(app.comment_options);
				console.log(`\n\nVideo status: ${video.status} (${video.reason})`);
				if (video.status === 'OK') console.log(`Success - comments saved to ${video.cfn}`);
			} else {
				console.log(`\n\nVideo status: ${video.status} (${video.reason})`);
			}
			console.log('\nVideo comments json saved to ./examples/videoComments.json');
			fs.writeFileSync('./examples/videoComments.json', ut.jsp(video.commentData), 'utf8');
			console.log(`\nDownloading test video using given test options`);
			await video.download();
			console.log(`\n\nVideo status: ${video.status} (${video.reason})`);
			if (video.downloaded) {
				console.log(`Success - video saved to ${video.fn}`);
				console.log(`\nDownloading video using video stream 3 and audio stream 1 (mp4 only)`);
				app.downloaded = 0;
				await video.download({ videoFormat: 3, audioFormat: 1 });
				console.log(`\n\nVideo status: ${video.status} (${video.reason})`);
				if (video.downloaded) {
					console.log(`Success - custom video saved to ${video.fn}`);
					console.log(`\nDownloading video only`);
					video.updateOptions(app.test_options);
					app.downloaded = 0;
					await video.download({ audioQuality: 'none' });
					console.log(`\n\nVideo status: ${video.status} (${video.reason})`);
					if (video.downloaded) {
						console.log(`Success - video only saved to ${video.fn}`);
						console.log(`\nDownloading audio only`);
						video.updateOptions(app.test_options);
						app.downloaded = 0;
						await video.download({ videoQuality: 'none', container: 'mp3' });
						console.log(`\n\nVideo status: ${video.status} (${video.reason})`);
						if (video.downloaded) {
							console.log(`Success - audio only (mp3) saved to ${video.fn}`);
						}
					}
				}
			}
		}
	}
}

if (process.argv.length === 2) {
	run();
} else if (process.argv.length === 3) {
	app.test_options.id = process.argv[2];
	run();
} else {
	console.log('usage: >node video_test [video_id]');
}
