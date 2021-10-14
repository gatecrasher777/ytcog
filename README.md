# ytcog
![NPM](https://img.shields.io/npm/l/ytcog?style=plastic)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Gatecrasher777/ytcog?style=plastic)  
YouTube innertube class library for node-js; session, searches, channels, playlists, videos and downloads.

## Features

* Simple, efficient, fast, powerful. 
* No Google developer key required.  
* The innertube api is what the YouTube website itself uses to efficiently deliver  search, channel and video information (json only).
* The downloader is a forked process allowing for concurrent non-blocking, high quality downloads.

## Classes

* __Session__ - manage your Youtube session/player - deciphering, encoding and hashing - enables seemless search, channel, playlist, video and download requests.
* __Search__ - fetch videos, playlists and channels from specific search requests. 
* __Channel__ - fetch metadata, videos, playlists, associated channels or search specific channels. 
* __Playlist__ - fetch videos from specific playlists 
* __Video__ - fetch metadata and stream information deciphered/encoded to avoid throttling - ensure reliable and fast downloads.
* __Download__ - a convenience object for easy once-off, sessionless, downloads.

See the [wiki](https://github.com/gatecrasher777/ytcog/wiki) for greater detail.

## Basic Usage 

### Easy downloader

```js
const ytcog = require('ytcog');
await ytcog.dl(videoOptions[,cookie,userAgent]);
```

__videoOptions__ (object) See the [wiki](https://github.com/gatecrasher777/ytcog/wiki/Video#Options) for all videoOptions.  
__cookie__ (string) is optional. With a cookie, everything will work. Without it, age-restricted video streams will not be retrieved and there might be some rate-limiting (although none reported so far)  
__userAgent__ (string) is optional. Since ytcog emulates a browser session, you can make all requests use your browser's user agent.  

NB: If you are downloading multiple videos (i.e. from search results, playlists or channels) then maintianing a session and using video.download() is much more efficient than running ytcog.dl() on each video.

### Session

```js
const ytcog = require('ytcog');
const session = new ytcog.Session([cookie, userAgent]);
await session.fetch();
console.log(`session status: ${session.status}`);
```

__cookie__ and __userAgent__ are optional, but in order to obtain them log onto YouTube in your browser. Goto settings > ... > developer tools. Refresh the page. Goto network>headers. Find the "www.youtube.com" entry. In the request headers you will find "cookie" and "user-agent". Pass these string values in your ytcog sessions. 

A session object is required to create search, channel, playlist and video objects.

### Search

```js
const search = new ytcog.Search(session, searchOptions);
await search.fetch();
```
__session__ (Session) the session object, see above.
__searchOptions__ (Object) See the [wiki](https://github.com/gatecrasher777/ytcog/wiki/Search#Options) for all search options.  

Search again with different options:

```js
await search.fetch({items: 'videos', period:'year', order: 'views', features: 'hd', quantity: 500 });
```

Examine the results in an array of Video objects:

```js
search.videos.forEach((video)=>{
    // do something with the results, like collect and display their streams
    await video.fetch();
    console.log(video.info());
    console.log(video.streamInfo);
});
```

Also search for playlists, channels and movies that match your search term

```js
await search.fetch({items:'playlists'});
await search.fetch({items:'channels'});
await search.fetch({items:'movies'});
```

Iterate through the current results with:

```js
search.results.forEach((item)=>{});
```

Or the accumulated results

```js
search.playlists.forEach((playlist)=>{...});
search.channels.forEach((channel)=>{...});
search.videos.forEach((video)=>{...});
```

### Channel

```js
const channel = new ytcog.Channel(session, channelOptions);
await channel.fetch();
```

__channelOptions__ See [wiki](https://github.com/gatecrasher777/ytcog/wiki/Channel#Options) for all channel options.

Get channel playlists 

```js
await channel.fetch({items: 'playlists', order: 'updated', quantity: 90});
```

Get associated channels 

```js
await channel.fetch({items: 'channels'});
```

Search a channel

```js
await channel.fetch({items: 'search', query: 'vlogs'});
```

Iterate through the results with:

```js
channel.results.forEach((item)=>{});  //current
channel.videos.forEach((video)=>{...}); //accumulated
channel.playlists.forEach((playlist)=>{...}); //accumulated
channel.channels.forEach((chan)=>{...}); //accumulated
```

### Playlist

```js
const playlist = new ytcog.Playlist(session, playlistOptions);
await playlist.fetch();
```

__playlistOptions__ See [wiki](https://github.com/gatecrasher777/ytcog/wiki/Playlist#Options) for all playlist options.

Get 100 videos from a playlist
```js
await playlist.fetch({quantity:100});
```

Get all the videos from a playlist 
```js
await playlist.fetch({quantity: playlist.videoCount});
```

Iterate through the results with:
```js
playlist.results.forEach((video)=>{...}) //current
playlist.videos.forEach((video)=>{...}); //accumulated
```

### Video

Get metadata, media and stream information:
```js
const video = new ytcog.Video(session, videoOptions);
await video.fetch();
```

Or just download:
```js
const video = new ytcog.Video(session, videoOptions);
await video.download();
```

__videoOptions__ See [wiki](https://github.com/gatecrasher777/ytcog/wiki/Video#Options) for all video options. 

### Examples

Check the [examples folder](https://github.com/gatecrasher777/ytcog/tree/main/examples) for more clarity on usage of Session, Search, Channel, Playlist and Video classes. 

To tun the examples:
```bash
~ytcog$ node examples/session_test
~ytcog$ node examples/search_test [query]
~ytcog$ node examples/channel_test [id]
~ytcog$ node examples/playlist_test [id]
~ytcog$ node examples/video_test [id]
~ytcog$ node examples/dl_test [id]
```

## Install 

```bash
npm install ytcog
```

## Disclaimer 

YouTube can and will change how their innertube api works at any time. So potential disruptions are likely in the future. I will try to evolve and adapt this library asap, but without gaurantees. 

## Command Line Interface

Try out the command line interface (CLI) to this library:

* [ytcog-dl](https://github.com/gatecrasher777/ytcog-dl)

## Acknowledgement 

To the following node-js projects on which ytcog has a dependency:

* [miniget](https://github.com/fent/node-miniget) (robust web requests)
* [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) (muxing video and audio downloads; embedding metadata as necessary)
* [sanitize-filename](https://github.com/parshap/node-sanitize-filename) (as the name suggests)
