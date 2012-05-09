var check = require('validator').check,
	sanitize = require('validator').sanitize;

var models = require('../models'),
  Person = models.Person,
  Topic = models.Topic,
  Tag = models.Tag,
  Message = models.Message;

var controllers;

var helpers = require('../helpers');

/*
 * GET /comments
 */
exports.index = function(req, res){

  if(req.params.format && req.params.format == 'json'){

    var res_obj = {
      success: true,
      message: '',
      comments: []
    };

    if(req.session.person){
      res_obj.avatar = req.session.person.avatar;
    }
    else{
      res_obj.avatar = '';
    }

    var topic_id = req.query.tid;

    if(!topic_id){
      res_obj.success = false;
      res_obj.message = '参数错误';
      res.json(res_obj);
      return;
    }

    Message
    .find({topic: topic_id}, ['content', 'created_at', 'author', 'topic', 'parent'], { sort: [[ 'created_at', 'desc' ]]})
    .populate('author', ['_id', 'name', 'email', 'avatar'])
    .populate('topic', ['_id', 'title'])
    .populate('parent')
    .limit(10)
    .run(function(err, comments){
      res_obj.comments = comments;
      res.json(res_obj);
      return;
    });

  }
  else{

    if(!req.session.person || !req.session.person.is_root){
      req.flash('msg_alert', '您没有操作权限。');
      res.redirect('/notify');
      return;
    }

    Message
    .find({}, ['content', 'created_at', 'author', 'topic', 'parent'], { sort: [[ 'created_at', 'desc' ]]})
    .populate('author', ['_id', 'name', 'email', 'avatar'])
    .populate('topic', ['_id', 'title'])
    .populate('parent')
    .limit(10)
    .run(function(err, comments){

      res.locals({
        comments: comments,
        layout: 'layouts/person'
      });

      res.render('comments/index');
      return;
    });

  }

};

/*
 * POST /comments
 */
exports.create = function(req, res){
  var res_obj = {
    success: true,
    message: ''
  };

  if(!req.session.person){
    res_obj.success = false;
    res_obj.message = '您还未登录，不能发布评论';
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

    var message = new Message();
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
    message.type = 'comment';
    message.content = content;
    message.topic = topic._id;
    message.author = req.session.person._id;

    message.save(function(err){
      topic.comments.push(message);
      topic.save(function(err){
        res_obj.success = true;
        res_obj.message = '评论已经成功保存';
        res.json(res_obj);
      });
    });
  
  });

};

/*
 * POST /comments/:id/delete
 */
exports.destroy = function(req, res){
  if(!req.session.person || !req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  var comment_id = req.params.id;

  Message
  .remove({_id: comment_id}, function(err){
    req.flash('msg_success', '评论已经成功删除。');
    res.redirect('/comments');
  });
  
};

