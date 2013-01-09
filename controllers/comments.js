var check = require('validator').check,
	sanitize = require('validator').sanitize;

var models = require('../models'),
  Person = models.Person,
  Topic = models.Topic,
  Tag = models.Tag,
  Message = models.Message;

var controllers;

var helpers = require('../helpers');

var words = {
  name: '评论',
  new: '新增',
  create: '创建',
  edit: '编辑',
  update: '更新',
  destroy: '删除',
  no_login: '您还未登录，不能进行当前操作。',
  no_exist: '此评论不存在或已被删除。',
  permission_denied: '您没有操作权限。',
  empty_name: '名称或描述不能为空。',
  empty_content: '内容不能为空。',
  success_create: '新评论已经保存，请继续发布。',
  success_update: '评论已经更新！',
  success_destroy: '评论已经成功删除。',
  params_error: '参数错误',
  find_error: '加载话题或参数错误'
}

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
      res_obj.message = words.params_error;
      res.json(res_obj);
      return;
    }

    Message
    .find({topic: topic_id}, 'content created_at author topic parent', { sort: [[ 'created_at', 'desc' ]]})
    .populate('author', '_id name email avatar')
    .populate('topic', '_id title')
    .populate('parent')
    .limit(10)
    .exec(function(err, comments){
      res_obj.comments = comments;
      res.json(res_obj);
      return;
    });

  }
  else{

    if(!req.session.person || !req.session.person.is_root){
      res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
      res.redirect('/notify');
      return;
    }

    // 分页对象
    var pagination = {
      max_items: 0,
      max_pages:0,
      items_per_page: 20,
      link_to: '/topics',
      prev_page: 0,
      next_page: 0,
      current_page: 0
    };

    res.locals.pagination = pagination;

    Message
    .find({}, 'content created_at author topic parent', { sort: [[ 'created_at', 'desc' ]]})
    .populate('author', '_id name email avatar')
    .populate('topic', '_id title')
    .populate('parent')
    .limit(10)
    .exec(function(err, comments){

      res.locals({
        comments: comments
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
    res_obj.message = words.no_login;
    res.json(res_obj);
    return;
  }
  
  var topic_id = req.body.tid;

  if(!topic_id){
    res_obj.success = false;
    res_obj.message = words.params_error;
    res.json(res_obj);
    return;
  }

  Topic
  .findById(topic_id)
  .exec(function(err, topic){
    
    if(err || !topic){
      res_obj.success = false;
      res_obj.message = words.find_error;
      res.json(res_obj);
      return;
    }

    var message = new Message();
    var content = sanitize(req.body.content).trim();

    // 验证内容是否为空
    if(content == ''){
      res_obj.success = false;
      res_obj.message = words.empty_content;
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
        res_obj.message = words.success_create;
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
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var comment_id = req.params.id;

  Message
  .remove({_id: comment_id}, function(err){
    res.app.locals.messages.push({ type: 'success', content: words.success_destroy });
    res.redirect('/comments');
  });
  
};

