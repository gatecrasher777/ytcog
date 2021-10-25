// ytcog - innertube library - example to test search class
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
	test_options: {
		// any search term
		query: 'soccer',
		// any, videos, channels, playlists, movies
		items: 'any',
		// relevance, age, views, rating
		order: 'relevance',
		// any,hour,day,week,month,year
		period: 'week',
		// any, short, medium, long
		duration: 'any',
		// number of results to fetch. You can get further results with subsequent search.continued() calls
		quantity: 100,
		// can include one or more comma-separated:
		// live, 4k, hd, subtitles, cc, 360, vr180, 3d, hdr, location, purchased
		features: '',
	},
};

async function run() {
	let session = new ytcog.Session(app.cookie, app.userAgent, app.proxy);
	await session.fetch();
	console.log(`Session status: ${session.status} (${session.reason})`);
	if (session.status === 'OK') {
		let search = new ytcog.Search(session, app.test_options);
		search.debugOn = true;
		await search.fetch();
		console.log(`\nSearch status: ${search.status} (${search.reason})`);
		if (search.status === 'OK') {
			console.log(`Found ${search.results.length} results for "${search.options.query}"`);
			console.log('\nSearch info/results saved to ./examples/search_results.json');
			let output1 = {
				search: search.info(['cookie', 'userAgent', 'sapisid']),
				results: [],
			};
			search.results.forEach(item => {
				output1.results.push(item.info(['cookie', 'userAgent', 'options', 'sapisid',
					'status', 'reason', 'cancelled']));
			});
			fs.writeFileSync('./examples/search_results.json', ut.jsp(output1), 'utf8');
			console.log('Raw search json saved to ./examples/search.json');
			fs.writeFileSync('./examples/search.json', ut.jsp(search.data), 'utf8');
			console.log('\n\nSearch for 50 channels');
			await search.fetch({ items: 'channels', quantity: 50 });
			console.log(`\nSearch status: ${search.status} (${search.reason})`);
			if (search.status === 'OK') {
				console.log(`Found ${search.results.length} results for "${search.options.query}"`);
				console.log('\nSearch info/results saved to ./examples/search_channels.json');
				let output2 = {
					search: search.info(['cookie', 'userAgent', 'sapisid']),
					results: [],
				};
				search.results.forEach(item => {
					output2.results.push(item.info(['cookie', 'userAgent', 'options', 'sapisid',
						'status', 'reason', 'cancelled']));
				});
				fs.writeFileSync('./examples/search_channels.json', ut.jsp(output2), 'utf8');
				console.log('Raw search json saved to ./examples/searchC.json');
				fs.writeFileSync('./examples/searchC.json', ut.jsp(search.data), 'utf8');
				console.log('\n\nSearch for 30 playlists');
				await search.fetch({ items: 'playlists', quantity: 30 });
				console.log(`\nSearch status: ${search.status} (${search.reason})`);
				if (search.status === 'OK') {
					console.log(`Found ${search.results.length} results for "${search.options.query}"`);
					console.log('\nSearch info/results saved to ./examples/search_playlists.json');
					let output3 = {
						search: search.info(['cookie', 'userAgent', 'sapisid']),
						results: [],
					};
					search.results.forEach(item => {
						output3.results.push(item.info(['cookie', 'userAgent', 'options', 'sapisid',
							'status', 'reason', 'cancelled']));
					});
					fs.writeFileSync('./examples/search_playlists.json', ut.jsp(output3), 'utf8');
					console.log('Raw search json saved to ./examples/searchP.json');
					fs.writeFileSync('./examples/searchP.json', ut.jsp(search.data), 'utf8');
				}
			}
		}
	}
}

if (process.argv.length === 2) {
	run();
} else if (process.argv.length === 3) {
	app.test_options.query = process.argv[2];
	run();
} else {
	console.log('usage: >node search_test [search_query]');
}
