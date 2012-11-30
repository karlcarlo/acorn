#! /usr/bin/env node
console.log('\nAcorn init start...');
var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , mongoose = require('mongoose')
  , async = require('async')
  , config= require('../config').config;

// mongodb connect
mongoose.connect(config.database.url, function(err){
  if(err){
    console.log('connect to db error: ' + err.message);
    process.exit(1);
  }
});

// Models
require('../models/person');
require('../models/topic');
require('../models/tag');
require('../models/message');
require('../models/asset');

var Person = mongoose.model('Person')
  , Topic = mongoose.model('Topic')
  , Tag = mongoose.model('Tag')
  , Message = mongoose.model('Message');

async.waterfall([
  function(callback){
    var basedir = path.normalize(__dirname + '/../')
      , tmpdir = path.join(basedir, 'tmp')
      , uploaddir = path.join(basedir, 'public/uploads');
    async.series([
      function(callback){
        fs.exists(tmpdir, function(exists){
          if(!exists){
            fs.mkdir(tmpdir, function(){
              console.log('tmp directory was successfully created.');
              callback(null, tmpdir);
            });
          }
          else{
            callback(null, tmpdir);
          }
        });
      },
      function(callback){
        fs.exists(uploaddir, function(exists){
          if(!exists){
            fs.mkdir(uploaddir, function(){
              console.log('upload directory was successfully created.');
              callback(null, uploaddir);
            });
          }
          else{
            callback(null, uploaddir);
          }
        });  
      }
  
    ],
    function(err, results){
        console.log('set env done');
        callback();
    });    
  },
  
  function(callback){
    Person.findOne({ 'email': config.application.root_account }, function(err, person){
      if(person){
        console.log('root account already exist!\nAcorn init exited.');
        mongoose.disconnect();
        process.exit(0);
      }
      else{
        var person = new Person();
        person.email = config.application.root_account;
        person.salt = 'salt1336484866068';
        person.hashed_password = 'f4a5bd2867e9bd5cf79a8b31348c03d27993f561'; // origin_password: 123456
        person.name = '管理员';
        person.avatar = '/images/icon_avatar.png';
        person.active = true;
        person.save(function(err){
          console.log('root account(' + person.email + ') was successfully created.');
          callback(null, person);
        });
      }
    });
  },

  function(person, callback){
    var tag = new Tag();
    tag.name = '默认';
    tag.description = '默认标签分类';
    tag.sequence = 0;
    tag.save(function(err){
      console.log('tag was successfully created.');
      callback(null, person, tag);
    });
  },

  function(person, tag, callback){
    var readme_path = path.normalize(__dirname + '/../README.md')
      , readme_file = fs.readFileSync(readme_path, 'utf-8');

    var topic = new Topic();
    topic.title = '欢迎使用Acorn博客平台';
    topic.content = readme_file.toString();
    topic.author = person._id;
    topic.permission = 'public';
    topic.tags.push(tag);
    topic.is_elite = true;
    topic.topimg = '/images/topimg_topic.png';
    topic.save(function(err){
      console.log('topic was successfully created.');

      callback(null, person, tag, topic);
    });
  },

  function(person, tag, topic, callback){
    var message = new Message();
    message.type = 'comment';
    message.content = '欢迎使用评论';
    message.topic = topic._id;
    message.author = person._id;

    message.save(function(err){
      topic.comments.push(message);
      topic.save(function(err){
        console.log('comment was successfully added.');
        
        callback(null);
      });
    });
  }

], function(err, results) {
  console.log('Acorn init well done, get started now.');
  mongoose.disconnect();
  process.exit(0);
});
