// ytcog - innertube library - examples to test playlist class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');
const ut = require('../lib/ut')();
const fs = require('fs');

// User editable data:
let app = {
	// logged-in cookie string
	cookie: '',
	// browser user agent
	userAgent: '',
	// proxy agent string
	proxy: '',
	// info fields to ignore
	ignore: ['cookie', 'userAgent', 'options', 'sapisid', 'status', 'reason',
		'cancelled', 'canEmbed', 'isLive', 'debugOn'],
	test_options: {
		// 'J7', //any playlist id
		id: 'PLQ_voP4Q3cffatM_zKUO5-woz34KyLrPL',
		// number of results to fetch. You can get a further 100 more videos (if available)
		// with subsequent playlist.continued() calls
		quantity: 100,
	},
};

async function run() {
	let session = new ytcog.Session(app.cookie, app.userAgent, app.cookie);
	await session.fetch();
	console.log(`Session status: ${session.status} (${session.reason})`);
	if (session.status === 'OK') {
		let playlist = new ytcog.Playlist(session, app.test_options);
		playlist.debugOn = true;
		console.log('\nFetch Playlist videos');
		await playlist.fetch();
		console.log(`Playlist status: ${playlist.status} (${playlist.reason})`);
		if (playlist.status === 'OK') {
			console.log(`\nLoaded ${playlist.results.length} videos of ${playlist.title}`);
			console.log('Want some more? Will continue...');
			await playlist.continued();
			console.log(`Playlist status: ${playlist.status} (${playlist.reason})`);
			if (playlist.status === 'OK') {
				console.log(`\nFound ${playlist.results.length} videos of ${playlist.title}`);
				console.log('\nPlaylist info/results to ./examples/playlist_results.json');
				let output = {
					playlist: playlist.info(app.ignore),
					results: [],
				};
				playlist.results.forEach(video => {
					output.results.push(video.info(app.ignore));
				});
				fs.writeFileSync('./examples/playlist_results.json', ut.jsp(output), 'utf8');
				console.log('Raw playlist json to ./examples/playlist.json');
				fs.writeFileSync('./examples/playlist.json', ut.jsp(playlist.data), 'utf8');
			} else {
				console.log('Raw playlist json to ./examples/playlist.json');
				fs.writeFileSync('./examples/playlist.json', ut.jsp(playlist.data), 'utf8');
			}
		} else {
			console.log('Raw playlist json to ./examples/playlist.json');
			fs.writeFileSync('./examples/playlist.json', ut.jsp(playlist.data), 'utf8');
		}
	}
}

if (process.argv.length === 2) {
	run();
} else if (process.argv.length === 3) {
	app.test_options.id = process.argv[2];
	run();
} else {
	console.log('usage: >node playlist_test [id]');
}
