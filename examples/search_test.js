// ytcog - innertube library - example to test search class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');
const ut = require('../lib/ut')();
const fs = require('fs');

//User editable data:
let app = {
    cookie: '',
    userAgent: '',
    test_options: {
        query: 'soccer', //any search term
        items: 'any', // any, videos, channels, playlists, movies
        order: 'relevance', // relevance, age, views, rating
        period: 'week', //any,hour,day,week,month,year 
        duration: 'any',	// any, short, medium, long
        quantity: 100,	//number of results to fetch. You can get further results with subsequent search.continued() calls 
        features: '' // can include one or more comma-separated: live, 4k, hd, subtitles, cc, 360, vr180, 3d, hdr, location, purchased
    }
}

async function run() {
    let session = new ytcog.Session(app.cookie,app.userAgent);
    await session.fetch();
    console.log(`Session status: ${session.status} (${session.reason})`);
    if (session.status == 'OK') {
        let search = new ytcog.Search(session,app.test_options);
        search.debugOn = true;
        await search.fetch();
        console.log(`\nSearch status: ${search.status} (${search.reason})`);
        if (search.status == 'OK') {
            console.log(`Found ${search.results.length} results for "${search.options.query}"`);
            console.log('\nSearch info/results saved to ./examples/search_results.json');
            let output = {
                search: search.info(['cookie','userAgent','sapisid']),
                results : []
            };
            search.results.forEach((item)=>{
                output.results.push(item.info(['cookie','userAgent','options','sapisid','status','reason','cancelled']));
            });
            fs.writeFileSync('./examples/search_results.json',ut.jsp(output),'utf8');
            console.log('Raw search json saved to ./examples/search.json');
            fs.writeFileSync('./examples/search.json',ut.jsp(search.data),'utf8');
            console.log('\n\nSearch for 50 channels')
            await search.fetch({items:'channels', quantity: 50});
            console.log(`\nSearch status: ${search.status} (${search.reason})`);
            if (search.status == 'OK') {
                console.log(`Found ${search.results.length} results for "${search.options.query}"`);
                console.log('\nSearch info/results saved to ./examples/search_channels.json');
                let output = {
                    search: search.info(['cookie','userAgent','sapisid']),
                    results : []
                };
                search.results.forEach((item)=>{
                    output.results.push(item.info(['cookie','userAgent','options','sapisid','status','reason','cancelled']));
                });
                fs.writeFileSync('./examples/search_channels.json',ut.jsp(output),'utf8');
                console.log('Raw search json saved to ./examples/searchC.json');
                fs.writeFileSync('./examples/searchC.json',ut.jsp(search.data),'utf8');
                console.log('\n\nSearch for 30 playlists')
                await search.fetch({items:'playlists', quantity: 30});
                console.log(`\nSearch status: ${search.status} (${search.reason})`);
                if (search.status == 'OK') {
                    console.log(`Found ${search.results.length} results for "${search.options.query}"`);
                    console.log('\nSearch info/results saved to ./examples/search_playlists.json');
                    let output = {
                        search: search.info(['cookie','userAgent','sapisid']),
                        results : []
                    };
                    search.results.forEach((item)=>{
                        output.results.push(item.info(['cookie','userAgent','options','sapisid','status','reason','cancelled']));
                    });
                    fs.writeFileSync('./examples/search_playlists.json',ut.jsp(output),'utf8');
                    console.log('Raw search json saved to ./examples/searchP.json');
                    fs.writeFileSync('./examples/searchP.json',ut.jsp(search.data),'utf8');
                }
            }
        }

    }
}

if (process.argv.length==2) {
    run();
} else if (process.argv.length==3) {
    app.test_options.query = process.argv[2];
    run();
} else {
    console.log('usage: >node search_test [search_query]');
}