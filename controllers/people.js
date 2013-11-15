var crypto = require('crypto'),
  config = require('../config');

var check = require('validator').check,
	sanitize = require('validator').sanitize;

var models = require('../models'),
	Person = models.Person,
  Topic = models.Topic;

var controllers;

var helpers = require('../helpers');

var words = {
  name: '用户',
  new: '新增',
  create: '创建',
  edit: '编辑',
  update: '更新',
  destroy: '删除',
  no_login: '您还未登录，不能进行当前操作。',
  no_exist: '此用户不存在或已被删除。',
  no_match_password: '新密码和确认密码不匹配。',
  is_exist_name: '新昵称已被占用。',
  permission_denied: '您没有操作权限。',
  error_password: '旧密码验证有误。',
  empty_name: '昵称为空。',
  empty_password: '密码、新密码或确认密码为空。',
  success_create: '新用户创建成功！',
  success_update_name: '昵称修改成功！',
  success_update_password: '密码修改成功！',
  success_update_active: '用户激活状态已成功修改。',
  success_destroy: '用户已经成功删除。'
}

/*
 * people controller
 */
exports.index = function(req, res, next){

  if(req.params.format && req.params.format == 'json'){
    var res_obj = {
      success: true,
      message: '',
      people: []
    };
    
    Person
    .find({ active: true }, '_id name email avatar title motto duty created_at', { sort: 'created_at' })
    .exec(function(err, people){
      res_obj.people = people;
      res.json(res_obj);
    });
  }
  else{
    
    if(!req.session.person || !req.session.person.is_root){
      res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
      res.redirect('/notify');
      return;
    }
    
    Person
    .find({}, null, { sort: '-created_at' })
    .exec(function(err, people){

      res.locals({
        people: people
      });
      
      res.render('people/index');
    });
  }

};

exports.profile = function(req, res, next){
  if(!req.session.person){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/signin');
    return;
  }

  Topic
  .find({ author: req.session.person._id }, null, { sort: '-updated_at' })
  .populate('author')
  .populate('tags', null, null, { sort: '-sequence -created_at' })
  .limit(10)
  .exec(function(err, topics){
    res.locals.topics = topics;
    res.render('people/profile');

  });
};

exports.set = function(req, res, next){
  if(!req.session.person){
    res.app.locals.messages.push({type: 'success', content: words.no_login});
    res.redirect('/signin');
    return;
  }

  // 缓存Session中person对象
  var session_person = req.session.person;

  res.locals({
    email: session_person.email
  })

  var method = req.method.toLowerCase();
  if(method == 'get'){
    res.render('people/set', {
      name: session_person.name, 
      person_title: session_person.title, 
      motto: session_person.motto
    });
    return;
  }

  if(method == 'post'){
    
    var name = sanitize(req.body.name).trim()
      , person_title = sanitize(req.body.person_title).trim()
      , motto = sanitize(req.body.motto).trim();

    name = sanitize(name);
    person_title = sanitize(person_title);
    motto = sanitize(motto);

    // 模版中缓存用户名密码
    res.locals({ 
      'name': name,
      'person_title': person_title,
      'motto': motto
    });

    //validator
    if(name == ''){
      res.app.locals.messages.push({type: 'alert', content: words.empty_name});
      res.render('people/set');
      return;
    }

    try{
      check(name, '昵称只能使用中文、英文和数字，长度为2~20个字符。').len(2, 20).is(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/);
    }
    catch(error){
      res.app.locals.messages.push({ type: 'error', content: error.message });
      res.render('people/set');
      return;
    }

    try{
      check(person_title, '头衔长度为2~20个字符。').len(0, 20);
    }
    catch(error){
      res.app.locals.messages.push({ type: 'error', content: error.message });
      res.render('people/set');
      return;
    }

    try{
      check(name, '个性签名长度为200个字符以内。').len(0, 200);
    }
    catch(error){
      res.app.locals.messages.push({ type: 'error', content: error.message });
      res.render('people/set');
      return;
    }


    Person.findOne({ 'name': name }, function(err, person){
      if(err) return next(err);
      if(name != session_person.name && person){
        res.app.locals.messages.push({ type: 'error', content: words.is_exist_name });
        res.render('people/set');
        return;
      }

      Person.findById(session_person._id, function(err, person){

        person.name = name;
        person.title = person_title;
        person.motto = motto;

        person.save(function(err){
          session_person.name = person.name;
          session_person.title = person.title;
          session_person.motto = person.motto;
          
          res.app.locals.messages.push({ type: 'success', content: words.success_update_name });
          res.redirect('/profile');
        });

      });

    });

  }

};

exports.set_password = function(req, res, next){
  if(!req.session.person){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/signin');
    return;
  }

  var method = req.method.toLowerCase();
  if(method == 'get'){
    res.render('people/set_password');
    return;
  }

  if(method == 'post'){
    
    var passwd = sanitize(req.body.passwd).trim(),
      new_passwd = sanitize(req.body.new_passwd).trim(),
      new_passwd2 = sanitize(req.body.new_passwd2).trim();

    passwd = sanitize(passwd);
    new_passwd = sanitize(new_passwd);
    new_passwd2 = sanitize(new_passwd2);

    // 缓存用户名密码
    res.locals({ 'passwd': passwd, 'new_passwd': new_passwd, 'new_passwd2': new_passwd2 });

    //validator
    if(passwd == '' || new_passwd == '' || new_passwd2 == ''){
      res.app.locals.messages.push({ type: 'alert', content: words.empty_password });
      res.render('people/set_password');
      return;
    }

    if(new_passwd != new_passwd2){
      res.app.locals.messages.push({ type: 'error', content: words.no_match_password });
      res.render('people/set_password');
      return;
    }

    try{
      check(passwd, '旧密码有误。').is(/^[\S]{6,20}$/);
      check(new_passwd, '新密码只能使用任意的非空白字符，长度为6~20个字符。').is(/^[\S]{6,20}$/);
    }
    catch(error){
      res.app.locals.messages.push({ type: 'error', content: error.message });
      res.render('people/set_password');
      return;
    }

    var session_person = req.session.person;

    var encrypted_passwd = encrypted_password(passwd, session_person.salt);
    if(session_person.hashed_password != encrypted_passwd){
      res.app.locals.messages.push({ type: 'error', content: words.error_password });
      res.render('people/set_password');
      return;
    }

    Person.findById(session_person._id, function(err, person){

      person.salt = create_salt();
      person.hashed_password = encrypted_password(new_passwd, person.salt);

      person.save(function(err){
        session_person.salt = person.salt;
        session_person.hashed_password = person.hashed_password;

        res.app.locals.messages.push({ type: 'success', content: words.success_update_password });
        res.redirect('/profile');
      });

    });

  }
  
  
};

/*
 * POST /people/:id/delete
 */
exports.destroy = function(req, res){

  if(!req.session.person || !req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var person_id = req.params.id;

  Person
  .remove({_id: person_id}, function(err){
    res.app.locals.messages.push({ type: 'success', content: words.success_destroy });
    res.redirect('/people');
  });
  
};

/*

 * PUT /people/:id/set_active
 */
exports.set_active = function(req, res){

  if(!req.session.person || !req.session.person.is_root){
    res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
    res.redirect('/notify');
    return;
  }

  var person_id = req.params.id
    , active = sanitize(req.body.active).trim();
  
  
  Person
  .findById(person_id)
  .exec(function(err, person){
  
    person.active = (active.toString().toLowerCase() === 'true')? true : false;
    
    person
    .save(function(err){
      res.app.locals.messages.push({ type: 'success', content: words.success_update_active });
      res.redirect('/people');
    });
    
  
  });
    
};



// private functions
function encrypted_password(passwd, salt) {
  var string_to_hash = passwd + 'feblog' + salt;
  return crypto.createHash('sha1').update(string_to_hash).digest('hex');
}

function create_salt(){
  return 'salt' + +new Date;
}
