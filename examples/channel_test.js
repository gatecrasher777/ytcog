// ytcog - innertube library - examples to test channel class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');
const ut = require('../lib/ut.js')();
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
	ignore: ['cookie', 'userAgent', 'options', 'sapisid', 'status', 'reason', 'cancelled', 'debugOn','commentOptions','commentOrder','canEmbed','isLive'],
	test_options: {
		// any channel id
		id: 'UCG5qGWdu8nIRZqJ_GgDwQ-w',
		// videos, shorts, playlists, channels, about, search
		items: 'about',
		// new (videos/playlists), old (videos), views (videos), updated (playlists)
		order: 'new',
		// number of results to fetch. You can get further videos (if available) with subsequent channel.continued() calls
		quantity: 30,
		// items=search only
		query: 'after:'+ new Date(ut.now()-1000*60*60*24*7).toISOString().substring(0,10),
	},
};

async function runAbout(channel) {
	console.log('\nFetch channel profile data (items: about)');
	await channel.fetch();
	console.log(`Channel status: ${channel.status} (${channel.reason})`);
	console.log('Raw Channel json to ./examples/channelAbout.json');
	fs.writeFileSync('./examples/channelAbout.json', ut.jsp(channel.data), 'utf8');
	if (channel.status === 'OK') {
		console.log(`\nChannel info for ${channel.author} to ./examples/channel_about.json`);
		fs.writeFileSync('./examples/channel_about.json', ut.jsp(channel.info(app.ignore)), 'utf8');
	}
}

async function runVideos(channel) {
	console.log('\nFetch latest Channel videos');
	await channel.fetch({ items: 'videos' });
	console.log(`Channel status: ${channel.status} (${channel.reason})`);
	console.log('Raw Channel json to ./examples/channelVideos.json');
	fs.writeFileSync('./examples/channelVideos.json', ut.jsp(channel.data), 'utf8');
	if (channel.status === 'OK') {
		console.log(`\nFound ${channel.results.length} results for ${channel.author}`);
		console.log('Want some more? Will continue...');
		await channel.continued();
		fs.writeFileSync('./examples/channelVideos.json', ut.jsp(channel.data), 'utf8');
		console.log(`Channel status: ${channel.status} (${channel.reason})`);
		if (channel.status === 'OK') {
			console.log(`\nFound ${channel.results.length} videos for ${channel.author}`);
			console.log('\nChannel info/videos to ./examples/channel_videos.json');
			let output = {
				channel: channel.info(app.ignore),
				videos: [],
			};
			channel.results.forEach(video => {
				output.videos.push(video.info(app.ignore));
			});
			fs.writeFileSync('./examples/channel_videos.json', ut.jsp(output), 'utf8');
		}
	}
}

async function runShorts(channel) {
	console.log('\nFetch latest Channel shorts');
	await channel.fetch({ items: 'shorts' });
	console.log(`Channel status: ${channel.status} (${channel.reason})`);
	console.log('Raw Channel json to ./examples/channelShorts.json');
	fs.writeFileSync('./examples/channelShorts.json', ut.jsp(channel.data), 'utf8');
	if (channel.status === 'OK') {
		console.log(`\nFound ${channel.results.length} results for ${channel.author}`);
		console.log('Want some more? Will continue...');
		await channel.continued();
		fs.writeFileSync('./examples/channelShorts.json', ut.jsp(channel.data), 'utf8');
		console.log(`Channel status: ${channel.status} (${channel.reason})`);
		if (channel.status === 'OK') {
			console.log(`\nFound ${channel.results.length} shorts for ${channel.author}`);
			console.log('\nChannel info/shorts to ./examples/channel_shorts.json');
			let output = {
				channel: channel.info(app.ignore),
				shorts: [],
			};
			channel.results.forEach(video => {
				output.shorts.push(video.info(app.ignore));
			});
			fs.writeFileSync('./examples/channel_shorts.json', ut.jsp(output), 'utf8');
		}
	}
}

async function runPlaylists(channel) {
	console.log('\n\nFetch 30 channel playlists (most recently updated)...');
	await channel.fetch({ items: 'playlists', order: 'updated', quantity: 30 });
	console.log('Raw Channel json to ./examples/channelPlaylists.json');
	fs.writeFileSync('./examples/channelPlaylists.json', ut.jsp(channel.data), 'utf8');
	console.log(`Channel status: ${channel.status} (${channel.reason})`);
	if (channel.status === 'OK') {
		console.log(`\nFound ${channel.results.length} playlist results for ${channel.author}`);
		console.log('\nChannel info/playlists to ./examples/channel_playlists.json');
		let output = {
			channel: channel.info(app.ignore),
			playlists: [],
		};
		channel.results.forEach(item => {
			output.playlists.push(item.info(app.ignore));
		});
		fs.writeFileSync('./examples/channel_playlists.json', ut.jsp(output), 'utf8');
	}
}

async function runChannels(channel) {
	console.log('\n\nFetch 20 related channels...');
	await channel.fetch({ items: 'channels', order: 'new', quantity: 20 });
	console.log('Raw Channel json to ./examples/channelChannels.json');
	fs.writeFileSync('./examples/channelChannels.json', ut.jsp(channel.data), 'utf8');
	console.log(`Channel status: ${channel.status} (${channel.reason})`);
	if (channel.status === 'OK') {
		console.log(`\nFound ${channel.results.length} related channels for ${channel.author}`);
		console.log('\nChannel info/channels to ./examples/channel_channels.json');
		let output = {
			channel: channel.info(app.ignore),
			channels: [],
		};
		channel.results.forEach(item => {
			output.channels.push(item.info(app.ignore));
		});
		fs.writeFileSync('./examples/channel_channels.json', ut.jsp(output), 'utf8');

	}
}

async function runSearch(channel) {
	console.log(`\n\nSearch for up to 100 videos/shorts in the channel with query: "${app.test_options.query}"`);
	await channel.fetch({ items: 'search',	quantity: 100 });
	console.log('Raw Channel json to ./examples/channelSearch.json');
	fs.writeFileSync('./examples/channelSearch.json', ut.jsp(channel.data), 'utf8');
	console.log(`Channel status: ${channel.status} (${channel.reason})`);
	if (channel.status === 'OK') {
		console.log(`\nFound ${channel.results.length} search results in ${channel
			.author} for "${channel.options.query}"`);
		console.log('\nChannel search info/videos to ./examples/channel_search.json');
		let output = {
			channel: channel.info(app.ignore),
			videos: [],
		};
		channel.results.forEach(item => {
			output.videos.push(item.info(app.ignore));
		});
		fs.writeFileSync('./examples/channel_search.json', ut.jsp(output), 'utf8');
	}
}

async function run() {
	let session = new ytcog.Session(app.cookie, app.userAgent, app.proxy);
	await session.fetch();
	console.log(`Session status: ${session.status} (${session.reason})`);
	if (session.status === 'OK') {
		let channel = new ytcog.Channel(session, app.test_options);
		channel.debugOn = true;
		await runAbout(channel);
		await runVideos(channel);
		await runShorts(channel);
		await runPlaylists(channel);
		await runChannels(channel);
		await runSearch(channel);
		console.log('Session complete.')
	} else {
		console.log('Session failed.')
	}
}

if (process.argv.length === 2) {
	run();
} else if (process.argv.length === 3) {
	app.test_options.id = process.argv[2];
	run();
} else {
	console.log('usage: >node channel_test [channel_id]');
}
