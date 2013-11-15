var crypto = require('crypto'),
  config = require('../config');

var check = require('validator').check,
  sanitize = require('validator').sanitize;

var models = require('../models'),
  Person = models.Person;

var controllers;

var helpers = require('../helpers');

var words = {
  signin: '登录',
  signup: '注册',
  signout: '退出',
  no_login: '您还未登录，不能进行当前操作。',
  no_exist: '用户不存在或已被删除。',
  no_active: '用户被冻结或未激活。',
  is_exist: '邮箱或昵称已被占用。',
  permission_denied: '您没有操作权限。',
  empty_email: '邮件或密码为空。',
  format_error_email: '邮件格式有误。',
  denied_email: '用户名或密码有误。',
  error_find_tags: '选中标签加载出错！',
  success_signin: '欢迎回来 ',
  success_siginup: '新用户注册成功！',
  success_siginout: '您已经成功退出登录。'
}


/*
 * auth controller
 */
exports.signin = function(req, res, next){

  var method = req.method.toLowerCase();
  if(method == 'get'){
    res.render('auth/signin');
    return;
  }
  if(method == 'post'){
    var email = sanitize(req.body.email).trim()
      , passwd = sanitize(req.body.passwd).trim();
    
    // 缓存用户名密码
    res.locals({ 'email': email, 'passwd': passwd });

    // validators
    if(email == '' || passwd == ''){
      res.app.locals.messages.push({type: 'alert', content: words.empty_email});
      res.render('auth/signin');
      return;
    }

    if(email !== config.application.root_account){
      try{
        check(email).len(6, 40).isEmail();
      }
      catch(error){
        res.app.locals.messages.push({type: 'error', content: words.format_error_email});
        res.render('auth/signin');
        return;
      }
    }

    Person.findOne({email: email}, function(err, person){
      if(!person){
        res.app.locals.messages.push({type: 'error', content: words.no_exist});
        res.render('auth/signin');
        return;
      }

      if(!person.active){
        res.app.locals.messages.push({type: 'error', content: words.no_active});
        res.render('auth/signin');
        return;
      }

      var encrypted_passwd = encrypted_password(passwd, person.salt);
      if(person.hashed_password != encrypted_passwd){
        res.app.locals.messages.push({type: 'error', content: words.denied_email});
        res.render('auth/signin');
        return;
      }

      // 存储用户对象到Session
      req.session.person = person;
      session_init(person, res);
      res.app.locals.messages.push({type: 'info', content: words.success_signin + person.name});
      res.redirect('/');
    });

  }
};

exports.signout = function(req, res, next){
  req.session.regenerate(function(err){
    res.app.locals.messages.push({type: 'alert', content: words.success_siginout});
    res.clearCookie(config.cookie.name, {path: '/'});
    res.redirect('/signin');
  });
};

exports.signup = function(req, res, next){

  var method = req.method.toLowerCase();
  if(method == 'get'){
    res.render('auth/signup');
    return;
  }

  if(method == 'post'){
    
    var email = sanitize(req.body.email.toLowerCase()).trim(),
      passwd = sanitize(req.body.passwd).trim(),
      name = sanitize(req.body.name).trim();

    // 缓存用户名密码
    res.locals({ 'email': email, 'passwd': passwd, 'name': name });

    //validator
    if(email == '' || passwd == '' || name == ''){
      res.app.locals.messages.push({type: 'alert', content: words.empty_email});
      res.render('auth/signup');
      return;
    }

    try{
      check(email, '邮件格式有误。').len(6, 40).isEmail();
    }
    catch(error){
      res.app.locals.messages.push({type: 'error', content: error.message});
      res.render('auth/signup');
      return;
    }

    try{
      check(passwd, '密码只能使用非空的任意字符，长度为6~20个字符。').is(/^[\S]{6,20}$/);
    }
    catch(error){
      res.app.locals.messages.push({type: 'error', content: error.message});
      res.render('auth/signup');
      return;
    }

    try{
      check(name, '昵称只能使用中文、英文和数字，长度为2~20个字符。').len(2, 20).is(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/);
    }
    catch(error){
      res.app.locals.messages.push({type: 'error', content: error.message});
      res.render('auth/signup');
      return;
    }

    Person.findOne({'$or': [{'name':name}, {'email':email}]}, function(err, person){
      if(err) return next(err);
      if(person){
        res.app.locals.messages.push({ type: 'error', content: words.is_exist });
        res.render('auth/signup');
        return;
      }

      var person = new Person();
      person.email = email;
      person.salt = create_salt();
      person.hashed_password = encrypted_password(passwd, person.salt);
      person.name = name;

      // default: '/images/icon_avatar.png'
      var avatar = 'http://cn.gravatar.com/avatar/' + crypto.createHash('md5').update(email).digest('hex') + '?size=48';

      person.avatar = avatar;
      
      person.save(function(err){
        res.app.locals.messages.push({type: 'success', content: words.success_siginup});
        res.redirect('/signin');
      });

    });

  }
  
  
};

exports.authenticate = function(req, res, next){
    if(req.session.person){
      var cookie = req.cookies[config.cookie.name];
      //console.log(helpers.decrypt(cookie, config.session.secret));
      //console.log('req.session.person');

      if(req.session.person.email == config.application.root_account){
        req.session.person.is_root = true;
      }
      else{
        req.session.person.is_root = false;
      }
      res.locals.member = req.session.person;
      return next();
    }
    else{
      var cookie = req.cookies[config.cookie.name];

      // 未登录
      if(typeof cookie != 'string' || cookie == ''){
        return next();
      }
      
      // 已登录
      var auth_token = helpers.decrypt(cookie, config.session.secret)
        , person_id = auth_token.split('|')[0];

      Person.findById(person_id, function(err, person){
        if(err){
          return next(err);
        }
        if(!person){
          return next();
        }

        if(person.email == config.application.root_account){
          person.is_root = true;
        }
        else{
          person.is_root = true;
        }

        req.session.person = person;
        res.locals.member = req.session.person;
        return next();

      });
    }

    //

  };

// private functions
function encrypted_password(passwd, salt) {
  var string_to_hash = passwd + 'feblog' + salt;
  return crypto.createHash('sha1').update(string_to_hash).digest('hex');
}

function create_salt(){
  return 'salt' + +new Date;
}

function session_init(person, res){
  var auth_token = helpers.encrypt(person._id + '|'+person.name + '|' + person.hashed_password +'|' + person.email, config.session.secret);
  res.cookie(config.cookie.name, auth_token, {path: '/', maxAge: 1000*60*60*24*14});    
}
