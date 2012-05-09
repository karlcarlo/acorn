var crypto = require('crypto'),
  config = require('../config').config;

var check = require('validator').check,
	sanitize = require('validator').sanitize;

var models = require('../models'),
	Person = models.Person,
  Topic = models.Topic;

var controllers;

var helpers = require('../helpers');

/*
 * people controller
 */
exports.index = function(req, res, next){


  Person
  .find({}, ['_id', 'name', 'email', 'avatar', 'created_at'], { sort: [[ 'created_at', 'asc' ]] })
  .run(function(err, people){

    if(req.params.format && req.params.format == 'json'){
      var res_obj = {
        success: true,
        message: '',
        people: []
      };

      res_obj.people = people;
      res.json(res_obj);
    }
    else{
      res.locals({
        people: people,
        layout: 'layouts/person'
      });
      res.render('people/index');
    }
  });

};

exports.profile = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能进行当前操作。');
    res.redirect('/signin');
    return;
  }

  Topic
  .find({ author: req.session.person._id }, null, { sort: [[ 'updated_at', 'desc' ]] })
  .populate('author')
  .populate('tags', null, null, { sort: [['sequence', 'desc'], [ 'created_at', 'desc' ]] })
  .limit(10)
  .run(function(err, topics){
    res.local('topics', topics);

    res.render('people/profile', { layout: 'layouts/person' });

  });
};

exports.set = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能进行设置操作。');
    res.redirect('/signin');
    return;
  }

  // 缓存Session中person对象
  var session_person = req.session.person;

  res.locals({
    email: session_person.email,
    layout: 'layouts/person'
  })

  var method = req.method.toLowerCase();
  if(method == 'get'){
    res.render('people/set', { name: session_person.name });
    return;
  }

  if(method == 'post'){
    
    var name = sanitize(req.body.name).trim();

    name = sanitize(name).xss();

    // 模版中缓存用户名密码
    res.locals({ 'name': name });

    //validator
    if(name == ''){
      req.flash('msg_alert', '昵称为空。');
      res.render('people/set');
			return;
    }

    try{
      check(name, '昵称只能使用中文、英文和数字，长度为2~20个字符。').len(2, 20).is(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/);
    }
    catch(error){
      req.flash('msg_error', error.message);
      res.render('people/set');
			return;
    }


    Person.findOne({ 'name': name }, function(err, person){
      if(err) return next(err);
      if(person){
        req.flash('msg_error', '新昵称已被占用。');
        res.render('people/set');
        return;
      }

      Person.findById(session_person._id, function(err, person){

        person.name = name;

        person.save(function(err){
          session_person.name = person.name;
          req.flash('msg_success', '昵称修改成功！');
          res.redirect('/profile');
        });

      });

    });

  }

};

exports.set_password = function(req, res, next){
  if(!req.session.person){
    req.flash('msg_alert', '您还未登录，不能进行设置操作。');
    res.redirect('/signin');
    return;
  }

  res.locals({
    layout: 'layouts/person'
  })

  var method = req.method.toLowerCase();
  if(method == 'get'){
    res.render('people/set_password');
    return;
  }

  if(method == 'post'){
    
    var passwd = sanitize(req.body.passwd).trim(),
      new_passwd = sanitize(req.body.new_passwd).trim(),
      new_passwd2 = sanitize(req.body.new_passwd2).trim();

    passwd = sanitize(passwd).xss();
    new_passwd = sanitize(new_passwd).xss();
    new_passwd2 = sanitize(new_passwd2).xss();

    // 缓存用户名密码
    res.locals({ 'passwd': passwd, 'new_passwd': new_passwd, 'new_passwd2': new_passwd2 });

    //validator
    if(passwd == '' || new_passwd == '' || new_passwd2 == ''){
      req.flash('msg_alert', '密码、新密码或确认密码为空。');
      res.render('people/set_password');
			return;
    }

    if(new_passwd != new_passwd2){
      req.flash('msg_alert', '新密码和确认密码不匹配。');
      res.render('people/set_password');
			return;
    }

    try{
      check(passwd, '旧密码有误。').is(/^[\S]{6,20}$/);
      check(new_passwd, '新密码只能使用任意的非空白字符，长度为6~20个字符。').is(/^[\S]{6,20}$/);
    }
    catch(error){
      req.flash('msg_error', error.message);
      res.render('people/set_password');
			return;
    }

    var session_person = req.session.person;

    var encrypted_passwd = encrypted_password(passwd, session_person.salt);
    if(session_person.hashed_password != encrypted_passwd){
      req.flash('msg_error', '旧密码验证有误。');
      res.render('people/set_password');
      return;
    }

    Person.findById(session_person._id, function(err, person){

      person.salt = create_salt();
      person.hashed_password = encrypted_password(new_passwd, person.salt);

      person.save(function(err){
        session_person.salt = person.salt;
        session_person.hashed_password = person.hashed_password;
        req.flash('msg_success', '密码修改成功！');
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
    req.flash('msg_alert', '您没有操作权限。');
    res.redirect('/notify');
    return;
  }

  var person_id = req.params.id;

  Person
  .remove({_id: person_id}, function(err){
    req.flash('msg_success', '用户已经成功删除。');
    res.redirect('/people');
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
