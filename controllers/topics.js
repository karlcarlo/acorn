var check = require('validator').check
  , sanitize = require('validator').sanitize
  , config = require('../config').config;

var models = require('../models')
  , Person = models.Person
  , Topic = models.Topic
  , Tag = models.Tag
  , Asset = models.Asset;

var controllers;

var helpers = require('../helpers');

var fs = require('fs');

var markdown = require('node-markdown').Markdown;


/*
 * GET topic index
 */
exports.index = function(req, res){

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

  var query_obj = {};
  
  if(req.query.page){
    pagination.current_page = parseInt(req.query.page);
  }

  // 按标签查询
  if(req.query.tag && req.query.tag.length == 24){
    query_obj.tags = req.query.tag
  }


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


  // 按标签查询话题

  Topic.count(query_obj, function(err, count){
    //分页设置
    pagination.max_items = count;
    pagination.max_pages = Math.ceil(pagination.max_items / pagination.items_per_page);
    pagination.prev_page = (pagination.current_page < 1)? 0 : pagination.current_page - 1;
    pagination.next_page = (pagination.current_page >= pagination.max_pages - 1)? pagination.max_pages - 1 : pagination.current_page + 1;



    Topic
    .find(query_obj, null, { sort: [[ 'updated_at', 'desc' ]]})
    .populate('author')
    .populate('tags', null, null, { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
    .populate('comments')
    .limit(pagination.items_per_page)
    .skip(pagination.current_page * pagination.items_per_page)
    .run(function(err, topics){
      res.local('pagination', pagination);
      res.render('topics/index', { topics: topics });
    });
  });

};

/*
 * GET topic show
 */
exports.show = function(req, res, next){
  var topic_id = req.params.id;

  if(topic_id.length != 24){
    req.flash('msg_error', '此话题不存在或已被删除。');
    res.redirect('/notify');
    return;
  }
  
  Topic
  .findById(topic_id)
  .populate('author')
  .populate('tags', null, null, { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
  .populate('comments')
  .run(function(err, topic){
    if(err){
      next(err);
    }
    if(!topic){
      req.flash('msg_error', '此话题不存在或已被删除。');
      res.redirect('/notify');
      return;
    }

    // 按照访问权限过滤话题
    if(topic.permission != 'public'){

      // 受保护话题
      if(!req.session.person){
        req.flash('msg_error', '您没有访问此话题的权限。');
        res.redirect('/notify');
        return;
      }

      // 私有话题
      if(topic.permission == 'private'){
        if(topic.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
          req.flash('msg_error', '您没有权限访问此话题。');
          res.redirect('/notify');
          return;
        }
      }
      
    }

    
    // Visit +1
    topic.visit_count += 1;

    Topic.update({ _id: topic._id }, { $set: { visit_count: topic.visit_count } }, function(err){
      
      // Markdown转HTML
      topic.content = markdown(topic.content);

      res.render('topics/show', { topic: topic });
    });

  });

};

/*
 * GET topic new
 */
exports.new = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能发布话题。');
    res.redirect('/signin');
    return;
  }

  res.locals({
    title: '新建话题',
    action: 'new',
    form_action: '/topics'
  });
  
  Tag
  .find({}, function(err, tags){
    if(err){
      next(err);
    }
    res.render('topics/edit', { tags: tags });
  });
};

/*
 * POST topic create
 */
exports.create = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能发布话题。');
    res.redirect('/signin');
    return;
  }
  

  var title = sanitize(req.body.title).trim()
    , content = sanitize(req.body.content).trim()
    , permission = req.body.permission
    , is_elite = req.body.is_elite
    , tag_ids = req.body.tags || [];

// 强制转换为数组
  if(!(tag_ids instanceof Array)){
    tag_ids = [tag_ids];
}

  title = sanitize(title).xss();

  res.locals({
    title: '新建话题',
    action: 'new',
    form_action: '/topics',
    topic_title: title,
    topic_content: content,
    topic_permission: permission,
    topic_is_elite: is_elite
  });

  Tag
  .find({}, function(err, tags){
    if(err){
      next(err);
    }
    
    // 验证是否勾选了标签
    if(!tag_ids.length){
      req.flash('msg_error', '至少需要为您的话题选择一个标签。');
      res.render('topics/edit', { tags: tags });
      return;
    }

    // 从全部标签中选中已选标签
    for(var i = 0; i < tags.length; i++){
      for(var j = 0; j < tag_ids.length; j++){
        if(tag_ids[j] == tags[i].id){
          tags[i].is_checked = true;
        }
      }
    }

    // 验证标题或内容是否为空
    if(title == '' || content == ''){
      req.flash('msg_alert', '标题或内容不能为空。');
      res.render('topics/edit', { tags: tags });
      return;
    }

    // 验证标题格式
    try{
      check(title, '标题为5~50个字。').len(5, 50);
    }
    catch(error){
      req.flash('msg_error', error.message);
      res.render('topics/edit', { tags: tags });
			return;
    }

    var topic = new Topic();
    topic.title = title;
    topic.content = content;
    topic.author = req.session.person._id;
    topic.permission = permission;

    // 校验标签
    Tag.find({_id: {$in: tag_ids}}, function(err, checked_tags){
      if(err){
        next(err);
      }
      if(!checked_tags){
        req.flash('msg_error', '选中标签加载出错！');
        res.render('topics/edit', { tags: tags });
        return;
      }

      for (var i = 0; i < checked_tags.length; i++){
        topic.tags.push(checked_tags[i]);
      }


      // 验证 分享到首页
      if(is_elite){
        
        topic.is_elite = true;
        var file = req.files.topimg;

        if(file){
          if(file.name == '' || file.size == 0){
            req.flash('msg_alert', '分享到首页展示时，话题头图不能为空。');
            res.render('topics/edit', { tags: tags });
            return;
          }

          var name = file.name
            , filename = +new Date + '_' + file.filename
            , temp_path = file.path
            , file_path = './public/uploads/' + filename;

            fs.rename(temp_path, file_path, function(err){
              if(err) throw err;
              fs.unlink(temp_path, function(){

                var asset = new Asset();
                asset.name = name;
                asset.filename = filename;
                asset.type = file.type;
                asset.size = file.size;
                asset.path = '/uploads/' + filename;
                asset.url = config.application.host + 'uploads/' + filename;

                asset.save(function(err){
                  topic.topimg = asset.url;

                  topic.save(function(err){
                    req.flash('msg_success', '新话题发布成功！');
                    res.redirect('/topics');
                    return;
                  });
                  
                });
              });
            });

        }
        else{
          req.flash('msg_alert', '分享到首页展示时，话题头图不能为空。');
          res.render('topics/edit', { tags: tags });
          return;
        }
      }
      else{
        topic.save(function(err){
          req.flash('msg_success', '新话题发布成功！');
          res.redirect('/topics');
          return;
        });
      }

    });
  });
  
};

/*
 * GET topic edit
 */
exports.edit = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能编辑话题。');
    res.redirect('/signin');
    return;
  }

  var topic_id = req.params.id;

  if(topic_id.length != 24){
    req.flash('msg_error', '此话题不存在或已被删除。');
    res.redirect('/notify');
    return;
  }

  Topic
  .findById(topic_id)
  .populate('author')
  .populate('tags', null, null, { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
  .run(function(err, topic){

    if(err) return next();
    
    if(!topic){
      req.flash('msg_error', '此话题不存在或已被删除。');
      res.redirect('/notify');
      return;
    }

    // 验证是否作者本人或管理员
    if(topic.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
      req.flash('msg_alert', '您没有操作权限。');
      res.redirect('/notify');
      return;
    }

    res.locals({
      title: '修改话题',
      action: 'edit',
      form_action: '/topics/' + topic_id
    });

    Tag
    .find({}, function(err, tags){
      if(err){
        next(err);
      }
      
      // 从全部标签中选中已选标签
      for(var i = 0; i < tags.length; i++){
        for(var j = 0; j < topic.tags.length; j++){
          if(tags[i].name == topic.tags[j].name){
            tags[i].is_checked = true;
          }
        }
      }

      res.render('topics/edit', { topic: topic, tags: tags });
    });
  });
};

/*
 * POST topic update
 */
exports.update = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能编辑话题。');
    res.redirect('/signin');
    return;
  }

  var topic_id = req.params.id
    , title = sanitize(req.body.title).trim()
    , content = sanitize(req.body.content).trim()
    , permission = req.body.permission
    , is_elite = req.body.is_elite
    , tag_ids = req.body.tags || [];

  // 强制转换为数组
  if(!(tag_ids instanceof Array)){
    tag_ids = [tag_ids];
  }

  title = sanitize(title).xss();

  res.locals({
    title: '修改话题',
    action: 'edit',
    form_action: '/topics/' + topic_id
  });

  Topic
  .findById(topic_id)
  .populate('author')
  .populate('tags', null, null, { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
  .run(function(err, topic){

    if(err) return next();

    if(topic.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
      req.flash('msg_alert', '您没有操作权限。');
      res.redirect('/notify');
      return;
    }

    Tag
    .find({}, function(err, tags){
      if(err){
        next(err);
      }

      // 更新话题对象
      topic.title = title;
      topic.content = content;
      topic.permission = permission;

      // 验证是否勾选了标签
      if(!tag_ids.length){
        req.flash('msg_error', '至少需要为您的话题选择一个标签。');
        res.render('topics/edit', { topic: topic, tags: tags });
        return;
      }

      // 从全部标签中选中已选标签
      for(var i = 0; i < tags.length; i++){
        for(var j = 0; j < tag_ids.length; j++){
          if(tag_ids[j] == tags[i].id){
            tags[i].is_checked = true;
          }
        }
      }

      // 验证标题或内容是否为空
      if(title == '' || content == ''){
        req.flash('msg_alert', '标题或内容不能为空。');
        res.render('topics/edit', { topic: topic, tags: tags });
        return;
      }

      // 验证标题格式
      try{
        check(title, '标题为5~50个字。').len(5, 50);
      }
      catch(error){
        req.flash('msg_error', error.message);
        res.render('topics/edit', { topic: topic, tags: tags });
        return;
      }

      /*
       * 从旧标签序列中更新当前标签状态
       * 由于Mongoose的嵌入文档保存机制不支持删除和添加同时保存，所以分两次保存Topic
       */
      // 清除旧标签并更新
      topic.tags.splice(0, topic.tags.length);
      topic.save(function(err){
        if(err){
          next(err);
        }
        // 添加新标签
        topic.tags.$pushAll(tag_ids);
        topic.save(function(err){
          if(err){
            next(err);
          }
          req.flash('msg_success', '话题已经更新。');
          res.redirect('/topics/' + topic.id);
        });
      });
      
    });

  });

};

/*
 * POST topic destroy
 */
exports.destroy = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能编辑话题。');
    res.redirect('/signin');
    return;
  }

  var topic_id = req.params.id;

  if(topic_id.length != 24){
    req.flash('msg_error', '此话题不存在或已被删除。');
    res.redirect('/notify');
    return;
  }

  Topic
  .findById(topic_id)
  .populate('author')
  .run(function(err, topic){

    if(err) return next();
    
    if(!topic){
      req.flash('msg_error', '此话题不存在或已被删除。');
      res.redirect('/notify');
      return;
    }

    // 验证是否作者本人或管理员
    if(topic.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
      req.flash('msg_alert', '您没有操作权限。');
      res.redirect('/notify');
      return;
    }

    Topic.remove({_id: topic_id}, function(err){
      req.flash('msg_success', '话题已经成功删除。');
      res.redirect('/profile');
    });

  });
  
};

// private function
