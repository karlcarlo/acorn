var mongoose = require('mongoose'),
	config= require('../config').config;

// mongodb connect
mongoose.connect(config.database.url, function(err){
	if(err){
		console.log('connect to db error: ' + err.message);
		process.exit(1);
	}
});

// Models
require('./person');
require('./topic');
require('./tag');
require('./message');
require('./asset');

// exports
exports.Person = mongoose.model('Person');
exports.Topic = mongoose.model('Topic');
exports.Tag = mongoose.model('Tag');
exports.Message = mongoose.model('Message');
exports.Asset = mongoose.model('Asset');