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

var words = {
  name: '资源',
  new: '新增',
  create: '创建',
  edit: '编辑',
  update: '更新',
  destroy: '删除',
  no_login: '您还未登录，不能进行当前操作。',
  no_exist: '此资源不存在或已被删除。',
  permission_denied: '您没有操作权限。',
  empty_name: '名称不能为空。',
  empty_content: '内容不能为空。',
  success_create: '新资源已经保存，请继续发布。',
  success_update: '资源已经更新！',
  success_destroy: '资源已经成功删除。',
  params_error: '参数错误',
  find_error: '加载资源或参数错误'
}

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

    Asset
    .find({}, null, { sort: [[ 'created_at', 'desc' ]]})
    .limit(20)
    .run(function(err, assets){
      res_obj.assets = assets;
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

    Asset
    .find({}, null, { sort: [[ 'created_at', 'desc' ]]})
    .exec(function(err, assets){

      res.locals({
        assets: assets
      });

      res.render('assets/index');
      return;
    });

  }

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

