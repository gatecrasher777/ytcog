const Session = require('./session');
const Search = require('./search');
const Channel = require('./channel');
const Video = require('./video');

ytcog = {
    Session : Session,
    Search: Search,
    Channel: Channel,
    Video: Video
}

module.exports = ytcog;
