// ytcog - innertube library - example to test channel class
// (c) 2021 gatecrasher777
// https://github.com/gatecrasher777/ytcog
// MIT Licenced

const ytcog = require('../lib/index');
const ut = require('../lib/ut.js')();
const fs = require('fs');

//User editable data:
let app = {
    cookie: '',
    userAgent: '',
    test_options: {
        id: 'UCG5qGWdu8nIRZqJ_GgDwQ-w', //any channel id
        order: 'about', // new, old, views, about
        quantity: 50 //number of videos to fetch. You can get further videos (if available) with subsequent channel.continued() calls 
    }
}

async function run() {
    let session = new ytcog.Session(app.cookie,app.userAgent);
    await session.fetch();
    console.log(`Session status: ${session.status} (${session.reason})`);
    if (session.status == 'OK') {
        let channel = new ytcog.Channel(session,app.test_options);       
        console.log('\nFetch channel profile data (order: about)');
        await channel.fetch();
        console.log(`Channel status: ${session.status} (${session.reason})`);
        if (channel.status=='OK') {
            console.log('\nFetch latest Channel videos (order: new)');
            channel.updateOptions({order:'new'});
            await channel.fetch();
            console.log(`Channel status: ${session.status} (${session.reason})`);
            if (channel.status == 'OK') {
                console.log(`\nFound ${channel.videos.length} videos for ${channel.author}`);
                console.log('Want some more? Will continue...');
                await channel.continued();
                console.log(`Channel status: ${session.status} (${session.reason})`);
                if (channel.status == 'OK') {
                    console.log(`\nFound ${channel.videos.length} videos for ${channel.author}`);
                    console.log('\nChannel info/results to ./examples/channel_results.json');
                    let output = {
                        channel: channel.info(['cookie','userAgent','sapisid']),
                        results : []
                    }
                    channel.videos.forEach((video)=>{
                        output.results.push(video.info(['cookie','userAgent','options','sapisid','status','reason','cancelled']));
                    });
                    fs.writeFileSync('./examples/channel_results.json',ut.jsp(output),'utf8');
                    console.log('Channel json to ./examples/channel.json');
                    fs.writeFileSync('./examples/channel.json',ut.jsp(channel.data),'utf8');
                }
            }
        }
    }
}

if (process.argv.length==2) {
    run();
} else if (process.argv.length==3) {
    app.test_options.id = process.argv[2];
    run();
} else {
    console.log('usage: >node channel_test [channel_id]');
}