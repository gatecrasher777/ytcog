# ytcog

YouTube innertube class library for node-js; sessions, players, searches, channels, videos and downloads.

## Features

* Simple, Efficient, Powerful and Fast. 
* No Google developer key required.  
* To get the most from ytcog, all you need is an active age-verified YouTube account.
* The innertube api is what the YouTube website itself uses to efficiently deliver  search, channel and video information (json only).

## Classes

* __Session__ - manage your Youtube session/player - enables seemless search, channel, video and download requests.
* __Player__ - used by the session object for deciphering, encoding and hashing - you would not normally need to use this directly.
* __Search__ - fetch videos from specific search requests. 
* __Channel__ - fetch metadata and videos from specific channels.
* __Video__ - create video objects directly or from search and channel scan results - fetch metadata and stream information deciphered/encoded as necessary - bypass rate limiting and age restrictions - ensure reliable and fast downloads - no more 429s, 404s and 403s.
* __Download__ - a convenience object for easy once-off, non-session, downloads.

See the [wiki](https://github.com/gatecrasher777/ytcog/wiki/ytcog-wiki) for greater detail.

## Usage 

### Easy downloader

```js
const ytcog = require('ytcog');
await ytcog.dl(downloadOptions);
```
See the [wiki](https://github.com/gatecrasher777/ytcog/wiki/ytcog-wiki#videodownload-options) for downloadOptions

### Session
```js
const ytcog = require('ytcog');
const session = new ytcog.Session([cookie, userAgent]);
await session.fetch();
```
With a cookie, everything just works. Without it, some things will fail. In order to obtain your youtube cookie and user agent: Log onto YouTube in your browser. Goto settings > ... > developer tools. Refresh the page. Goto network>headers. Find the "www.youtube.com" entry. In the request headers you will find "cookie" and "user-agent". Pass these string values in your ytcog sessions. 

A session object is required to create searches, channels and videos.

### Search
```js
const search = new ytcog.Search(session, searchOptions);
await search.fetch();
```
See the [wiki](https://github.com/gatecrasher777/ytcog/wiki/ytcog-wiki#search-options) for searchOptions.
Search again over a different period:
```js
search.updateOptions({period:'year'});
await search.fetch();
```
If available, you can get an additional (+-20) results with each successive continuation:
```js
await search.continued();    
```

### Channel
```js
const channel = new ytcog.Channel(session, channelOptions);
await channel.fetch();
```
See [wiki](https://github.com/gatecrasher777/ytcog/wiki/ytcog-wiki#channel-options) for channelOptions.
Get channel metadata with 
```js
channel.updateOptions({order:'about'}); 
await channel.fetch();
```
If available, you can get an additional (+-30) videos with each successive continuation
```js
await channel.continued();
```

### Video
```js
const video = new ytcog.Video(session, videoOptions);
await video.fetch();
await video.download([downloadOptions]);
```
See [wiki](https://github.com/gatecrasher777/ytcog/wiki/ytcog-wiki#videodownload-options) for videoOptions.  
A boolean function provides an inexpensive way to check if a video is still online:
```js
let found = await video.imageOnline();
```
Cancels the current download:
```js
video.cancel();
```
## Install

```bash
npm install ytcog
```
## Roadmap

There are some limitaions. ytcog does not currently handle playlists or download live videos. 

## Disclaimer 
YouTube can and will change how their innertube api works at any time. So potential disruptions are likely in the future. I will try to evolve and adapt this library asap, but without gaurantees. 

## Acknowledgement to the following node-js projects on which ytfomo depends:

* miniget (robust web requests)
* ffmpeg-static (muxing video & audio when necessary)
* sanitize-filename (as the name suggests)
