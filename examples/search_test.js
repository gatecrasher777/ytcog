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
        period: 'day', //any,hour,day,week,month,year
        order: 'relevance', // relevance, age, views, rating
        duration: 'any',	// any, short, long
        quantity: 100	//number of results to fetch. You can get further results with subsequent search.continued() calls 
    }
}

async function run() {
    let session = new ytcog.Session(app.cookie,app.userAgent);
    await session.fetch();
    console.log(`Session status: ${session.status} (${session.reason})`);
    if (session.status == 'OK') {
        let search = new ytcog.Search(session,app.test_options);
        await search.fetch();
        console.log(`\nSearch status: ${search.status} (${search.reason})`);
        if (search.status == 'OK') {
            console.log(`Found ${search.videos.length} videos for "${search.options.query}"`);
            console.log('\nSearch info/results saved to ./examples/search_results.json');
            let output = {
                search: search.info(['cookie','userAgent','sapisid']),
                results : []
            }
            search.videos.forEach((video)=>{
                output.results.push(video.info(['cookie','userAgent','options','sapisid','status','reason','cancelled']));
            });
            fs.writeFileSync('./examples/search_results.json',ut.jsp(output),'utf8');
            console.log('Search json saved to ./examples/search.json');
            fs.writeFileSync('./examples/search.json',ut.jsp(search.data),'utf8');
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