var config = require('../config').config;

var models = require('../models')
  , Topic = models.Topic;

var controllers;

var helpers = require('../helpers');

var markdown = require('node-markdown').Markdown;


/*
 * GET home page.
 */
exports.index = function(req, res){

  var query_obj = {};

  // 按照访问权限过滤话题
  if(req.session.person){
    query_obj.$or = [{
      permission: {
        $in: ['public', 'protect']
      }
    }, {
      author: req.session.person._id
    }];

    // 管理员可以查看所有话题
    if(req.session.person.email == config.application.root_account){
      query_obj.$or = [{}];
    }
  }
  else{
    query_obj.permission = 'public';
  }

  // 过滤首页推荐话题
  query_obj.is_elite = true;

  Topic
  .find(query_obj, null, { sort: [[ 'updated_at', 'desc' ]] })
  .populate('author')
  .populate('tags', null, null, { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
  .limit(6)
  .exec(function(err, topics){
    res.local('topics', topics);
    // 开源项目
    res.local('projects', [
      { url: '#', logo: '/images/icon_almond.png', name: '杏仁', codename: 'Almond', desc: '前端快速开发框架' }, 
      { url: '#', logo: '/images/icon_walnut.png', name: '核桃', codename: 'Walnut', desc: '辅助开发工具包' },
      { url: '#', logo: '/images/icon_acorn.png', name: '橡树果', codename: 'Acorn', desc: 'Node平台轻博客' },
      { url: '#', logo: '/images/logo_avatar.png', name: '松子', codename: 'Pinenut', desc: 'Less转css应用' }
    ]);
		res.render('home/index', { layout: 'layouts/home' });
	});

};

