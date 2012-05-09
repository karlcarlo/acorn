var check = require('validator').check,
	sanitize = require('validator').sanitize;

var models = require('../models'),
  Person = models.Person,
  Topic = models.Topic,
  Tag = models.Tag;

var controllers;

var helpers = require('../helpers');

exports.index = function(req, res, next){

  Tag
  .find({}, ['_id', 'name', 'description', 'sequence'], { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
  .run(function(err, tags){

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
      res.locals({
        tags: tags,
        layout: 'layouts/person'
      });
      res.render('tags/index');
    }


  });

  

};


/*
 * GET /tags/new
 */
exports.new = function(req, res){

  if(!req.session.person || !req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  res.locals({
    title: '新建标签',
    action: 'new',
    form_action: '/tags',
    layout: 'layouts/person'
  });

  res.render('tags/edit');
};

/*
 * POST /tags
 */
exports.create = function(req, res){
  
  if(!req.session.person || !req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  var tag = new Tag();

  var name = sanitize(req.body.name).trim()
    , description = sanitize(req.body.description).trim()
    , sequence = sanitize(req.body.sequence).trim();

  res.locals({
    title: '新建标签',
    action: 'new',
    form_action: '/tags',
    tag_name: name,
    tag_description: description,
    tag_sequence: sequence,
    layout: 'layouts/person'
  });

  // 验证名称或描述是否为空
  if(name == '' || description == ''){
    req.flash('msg_alert', '名称或描述不能为空。');
    res.render('tags/edit');
    return;
  }

  // 验证名称格式
  try{
    check(name, '名称为2~20个字。').len(2, 20);
  }
  catch(error){
    req.flash('msg_error', error.message);
    res.render('tags/edit');
    return;
  }

  //保存标签对象
  tag.name = name;
  tag.description = description;
  tag.sequence = sequence || 0;

  tag.save(function(err){
    req.flash('msg_success', '新标签已经保存，请继续添加。');
    res.redirect('/tags');
  });
  
};

/*
 * GET /tags/:id/edit
 */
exports.edit = function(req, res){
  
  if(!req.session.person || !req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  var tag_id = req.params.id;

  res.locals({
    title: '修改标签',
    action: 'edit',
    form_action: '/tags/' + tag_id,
    layout: 'layouts/person'
  });
  
  Tag
  .findById(tag_id)
  .run(function(err, tag){
    res.render('tags/edit', { tag: tag });
  });
};

/*
 * POST /tags/:id
 */
exports.update = function(req, res){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能编辑标签。');
    res.redirect('/signin');
    return;
  }

  if(!req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  var tag_id = req.params.id
    , name = sanitize(req.body.name).trim()
    , description = sanitize(req.body.description).trim()
    , sequence = sanitize(req.body.sequence).trim();

  res.locals({
    title: '修改标签',
    action: 'edit',
    form_action: '/tags/' + tag_id,
    layout: 'layouts/person'
  });

  Tag.findById(tag_id, function(err, tag){

    tag.name = name;
    tag.description = description;
    tag.sequence = sequence;

    // 验证名称或描述是否为空
    if(name == '' || description == ''){
      req.flash('msg_alert', '名称或描述不能为空。');
      res.render('tags/edit', { tag: tag });
      return;
    }

    // 验证名称格式
    try{
      check(name, '名称为2~20个字。').len(2, 20);
    }
    catch(error){
      req.flash('msg_error', error.message);
      res.render('tags/edit', { tag: tag });
			return;
    }

    tag.save(function(err){
      req.flash('msg_success', '标签已经更新。');
      res.render('tags', { tag: tag });
    });

  });

};

/*
 * POST /tags/:id/delete
 */
exports.destroy = function(req, res){

  if(!req.session.person || !req.session.person.is_root){
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  var tag_id = req.params.id;

  Tag
  .remove({_id: tag_id}, function(err){
    req.flash('msg_success', '标签已经成功删除。');
    res.redirect('/tags');
  });
  
};

