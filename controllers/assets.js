var check = require('validator').check,
	sanitize = require('validator').sanitize;

var models = require('../models'),
  Person = models.Person,
  Topic = models.Topic,
  Tag = models.Tag,
  Message = models.Message,
  Asset = models.Asset;

var controllers;

var helpers = require('../helpers');

/*
 * GET /tags
 */
exports.index = function(req, res){

  if(req.params.format && req.params.format == 'json'){
    var res_obj = {
      success: true,
      message: '',
      assets: []
    };

    Assetc
    .find({  }, [], { sort: [[ 'created_at', 'desc' ]]})
    .limit(20)
    .run(function(err, assets){
      res_obj.assets = assets;
      res.json(res_obj);
      return;
    });
  }

  res.redirect('/');

};

/*
 * POST /tags
 */
exports.create = function(req, res){
  var res_obj = {
    success: true,
    message: ''
  };

  if(!req.session.person){
    res_obj.success = false;
    res_obj.message = '您还未登录，不能编辑标签';
    res.json(res_obj);
    return;
  }
  
  var topic_id = req.body.tid;

  if(!topic_id){
    res_obj.success = false;
    res_obj.message = '参数错误';
    res.json(res_obj);
    return;
  }

  Topic
  .findById(topic_id)
  .run(function(err, topic){
    
    if(err || !topic){
      res_obj.success = false;
      res_obj.message = '加载话题或参数错误';
      res.json(res_obj);
      return;
    }

    var message = new Asset();
    var content = sanitize(req.body.content).trim();

    // 验证内容是否为空
    if(content == ''){
      res_obj.success = false;
      res_obj.message = '内容不能为空。';
      res.json(res_obj);
      return;
    }

    // 验证名称格式
    try{
      check(content, '名称为10~200个字符。').len(10, 200);
    }
    catch(error){
      res_obj.success = false;
      res_obj.message = error.message;
      res.json(res_obj);
      return;
    }

    //保存评论对象
    message.type = 'asset';
    message.content = content;
    message.topic = topic._id;
    message.author = req.session.person._id;

    message.save(function(err){
      res_obj.success = true;
      res_obj.message = '评论已经成功保存';
      res.json(res_obj);
    });
  
  });

};

/*
 * POST /assets/:id/delete
 */
exports.destroy = function(req, res){
  if(!req.session.person || !req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/signin');
    return;
  }
  var tag_id = req.params.id;

  Asset
  .remove({_id: tag_id}, function(err){
    req.flash('msg_success', '资源已经成功删除。');
    res.redirect('/profile');
  });
  
};

