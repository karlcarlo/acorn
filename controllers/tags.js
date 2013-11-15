var check = require('validator').check
  , sanitize = require('validator').sanitize;

var models = require('../models')
  , Person = models.Person
  , Topic = models.Topic
  , Tag = models.Tag;

var controllers;

var helpers = require('../helpers');

var words = {
  name: '标签',
  new: '新增',
  create: '创建',
  edit: '编辑',
  update: '更新',
  destroy: '删除',
  no_login: '您还未登录，不能进行当前操作。',
  no_exist: '此标签不存在或已被删除。',
  permission_denied: '您没有操作权限。',
  empty_name: '名称不能为空。',
  success_create: '新标签已经保存，请继续添加。',
  success_update: '标签已经更新！',
  success_destroy: '标签已经成功删除。'
}

exports.index = function(req, res, next){

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

  Tag
  .find({}, '_id name description sequence', { sort: 'sequence -created_at' })
  .exec(function(err, tags){

    if(req.params.format && req.params.format == 'json'){
      var res_obj = {
        success: true,
        message: '',
        tags: []
      };

      res_obj.tags = tags;
      res.json(res_obj);
      return;
    }
    else{
      res.render('tags/index', { tags: tags });
    }


  });

  

};


/*
 * GET /tags/new
 */
exports.new = function(req, res){

  if(!req.session.person || !req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/notify');
    return;
  }

  res.locals({
    title: words.new + words.name,
    action: 'new',
    form_action: '/tags',
    tag: {}
  });

  res.render('tags/edit');
};

/*
 * POST /tags
 */
exports.create = function(req, res){
  
  if(!req.session.person || !req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var tag = new Tag();

  var name = sanitize(req.body.name).trim()
    , description = sanitize(req.body.description).trim()
    , sequence = sanitize(req.body.sequence).trim();

  res.locals({
    title: words.new + words.name,
    action: 'new',
    form_action: '/tags',
    tag: {
      name: name,
      description: description,
      sequence: sequence
    }
  });

  // 验证名称或描述是否为空
  if(name == ''){
    res.app.locals.messages.push({ type: 'alert', content: words.empty_name });
    res.render('tags/edit');
    return;
  }

  // 验证名称格式
  try{
    check(name, '名称为2~20个字。').len(2, 20);
  }
  catch(error){
    res.app.locals.messages.push({ type: 'error', content: error.message });
    res.render('tags/edit');
    return;
  }

  // 验证描述格式
  try{
    check(description, '描述最多为50个字。').len(0, 50);
  }
  catch(error){
    res.app.locals.messages.push({ type: 'error', content: error.message });
    res.render('tags/edit');
    return;
  }

  //保存标签对象
  tag.name = name;
  tag.description = description || name;
  tag.sequence = sequence || 0;

  tag.save(function(err){
    res.app.locals.messages.push({ type: 'success', content: words.success_create });
    res.redirect('/tags');
  });
  
};

/*
 * GET /tags/:id/edit
 */
exports.edit = function(req, res){
  
  if(!req.session.person || !req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var tag_id = req.params.id;

  res.locals({
    title: words.edit + words.name,
    action: 'edit',
    form_action: '/tags/' + tag_id
  });
  
  Tag
  .findById(tag_id)
  .exec(function(err, tag){
    res.render('tags/edit', { tag: tag });
  });
};

/*
 * POST /tags/:id
 */
exports.update = function(req, res){
  if(!req.session.person){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/signin');
    return;
  }

  if(!req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var tag_id = req.params.id
    , name = sanitize(req.body.name).trim()
    , description = sanitize(req.body.description).trim()
    , sequence = sanitize(req.body.sequence).trim();

  res.locals({
    title: words.edit + words.name,
    action: 'edit',
    form_action: '/tags/' + tag_id
  });

  Tag.findById(tag_id, function(err, tag){

    tag.name = name;
    tag.description = description;
    tag.sequence = sequence;

    // 验证名称或描述是否为空
    if(name == '' || description == ''){
      res.app.locals.messages.push({ type: 'alert', content: words.empty_name });
      res.render('tags/edit', { tag: tag });
      return;
    }

    // 验证名称格式
    try{
      check(name, '名称为2~20个字。').len(2, 20);
    }
    catch(error){
      res.app.locals.messages.push({ type: 'error', content: error.message });
      res.render('tags/edit', { tag: tag });
			return;
    }

    tag.save(function(err){
      res.app.locals.messages.push({ type: 'success', content: words.success_update });
      res.redirect('/tags');
    });

  });

};

/*
 * POST /tags/:id/delete
 */
exports.destroy = function(req, res){

  if(!req.session.person || !req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var tag_id = req.params.id;

  Tag
  .remove({_id: tag_id}, function(err){
    res.app.locals.messages.push({ type: 'success', content: words.success_destroy });
    res.redirect('/tags');
  });
  
};

