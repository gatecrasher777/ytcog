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
	ignore: ['cookie', 'userAgent', 'options', 'sapisid', 'status', 'reason', 'cancelled'],
	test_options: {
		// any channel id
		id: 'UCG5qGWdu8nIRZqJ_GgDwQ-w',
		// videos, playlists, channels, about, search
		items: 'about',
		// new (videos/playlists), old (videos), views (videos), updated (playlists)
		order: 'new',
		// number of results to fetch. You can get further videos (if available) with subsequent channel.continued() calls
		quantity: 60,
		// items=search only
		query: '',
	},
};

async function run() {
	let session = new ytcog.Session(app.cookie, app.userAgent, app.proxy);
	await session.fetch();
	console.log(`Session status: ${session.status} (${session.reason})`);
	if (session.status === 'OK') {
		let channel = new ytcog.Channel(session, app.test_options);
		channel.debugOn = true;
		console.log('\nFetch channel profile data (items: about)');
		await channel.fetch();
		console.log('Raw Channel json to ./examples/channelA.json');
		fs.writeFileSync('./examples/channelA.json', ut.jsp(channel.data), 'utf8');
		console.log(`Channel status: ${channel.status} (${channel.reason})`);
		if (channel.status === 'OK') {
			console.log('\nFetch latest Channel videos');
			await channel.fetch({ items: 'videos' });
			console.log(`Channel status: ${channel.status} (${channel.reason})`);
			if (channel.status === 'OK') {
				console.log(`\nFound ${channel.results.length} results for ${channel.author}`);
				console.log('Want some more? Will continue...');
				await channel.continued();
				console.log(`Channel status: ${channel.status} (${channel.reason})`);
				if (channel.status === 'OK') {
					console.log(`\nFound ${channel.results.length} video results for ${channel.author}`);
					console.log('\nChannel info/results to ./examples/channel_results.json');
					let output1 = {
						channel: channel.info(app.ignore),
						results: [],
					};
					channel.results.forEach(video => {
						output1.results.push(video.info(app.ignore));
					});
					fs.writeFileSync('./examples/channel_results.json', ut.jsp(output1), 'utf8');
					console.log('Raw Channel json to ./examples/channel.json');
					fs.writeFileSync('./examples/channel.json', ut.jsp(channel.data), 'utf8');
					console.log('\n\nFetch 30 channel playlists (most recently updated)...');
					await channel.fetch({ items: 'playlists', order: 'updated', quantity: 30 });
					console.log(`Channel status: ${channel.status} (${channel.reason})`);
					if (channel.status === 'OK') {
						console.log(`\nFound ${channel.results.length} playlist results for ${channel.author}`);
						console.log('\nChannel info/results to ./examples/channel_playlists.json');
						let output2 = {
							channel: channel.info(app.ignore),
							results: [],
						};
						channel.results.forEach(item => {
							output2.results.push(item.info(app.ignore));
						});
						fs.writeFileSync('./examples/channel_playlists.json', ut.jsp(output2), 'utf8');
						console.log('Raw Channel json to ./examples/channelP.json');
						fs.writeFileSync('./examples/channelP.json', ut.jsp(channel.data), 'utf8');
						console.log('\n\nFetch 20 related channels...');
						await channel.fetch({ items: 'channels', order: 'new', quantity: 20 });
						console.log(`Channel status: ${channel.status} (${channel.reason})`);
						if (channel.status === 'OK') {
							console.log(`\nFound ${channel.results.length} channel results for ${channel.author}`);
							console.log('\nChannel info/results to ./examples/channel_channels.json');
							let output3 = {
								channel: channel.info(app.ignore),
								results: [],
							};
							channel.results.forEach(item => {
								output3.results.push(item.info(app.ignore));
							});
							fs.writeFileSync('./examples/channel_channels.json', ut.jsp(output3), 'utf8');
							console.log('Raw Channel json to ./examples/channelC.json');
							fs.writeFileSync('./examples/channelC.json', ut.jsp(channel.data), 'utf8');
							console.log('\n\nSearch for 20 videos in the channel ...');
							await channel.fetch({ items: 'search', query: 'Chelsea', quantity: 20 });
							console.log(`Channel status: ${channel.status} (${channel.reason})`);
							if (channel.status === 'OK') {
								console.log(`\nFound ${channel.results.length} search results in ${channel
									.author} for ${channel.options.query}`);
								console.log('\nChannel info/results to ./examples/channel_search.json');
								let output4 = {
									channel: channel.info(app.ignore),
									results: [],
								};
								channel.results.forEach(item => {
									output4.results.push(item.info(app.ignore));
								});
								fs.writeFileSync('./examples/channel_search.json', ut.jsp(output4), 'utf8');
								console.log('Raw Channel json to ./examples/channelS.json');
								fs.writeFileSync('./examples/channelS.json', ut.jsp(channel.data), 'utf8');
							} else {
								console.log('Raw Channel json to ./examples/channelS.json');
								fs.writeFileSync('./examples/channelS.json', ut.jsp(channel.data), 'utf8');
							}
						} else {
							console.log('Raw Channel json to ./examples/channelC.json');
							fs.writeFileSync('./examples/channelC.json', ut.jsp(channel.data), 'utf8');
						}
					} else {
						console.log('Raw Channel json to ./examples/channelP.json');
						fs.writeFileSync('./examples/channelP.json', ut.jsp(channel.data), 'utf8');
					}
				} else {
					console.log('Raw Channel json to ./examples/channel.json');
					fs.writeFileSync('./examples/channel.json', ut.jsp(channel.data), 'utf8');
				}
			} else {
				console.log('Raw Channel json to ./examples/channel.json');
				fs.writeFileSync('./examples/channel.json', ut.jsp(channel.data), 'utf8');
			}
		} else {
			console.log('Raw Channel json to ./examples/channelA.json');
			fs.writeFileSync('./examples/channelA.json', ut.jsp(channel.data), 'utf8');
		}
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
