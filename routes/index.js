var controllers = require('../controllers')
  , home_controller = controllers.home_controller
  , auth_controller = controllers.auth_controller
  , people_controller = controllers.people_controller
  , upload_controller = controllers.upload_controller
  , topics_controller = controllers.topics_controller
  , tags_controller = controllers.tags_controller
  , comments_controller = controllers.comments_controller
  , assets_controller = controllers.assets_controller;

// home
exports.index = home_controller.index;
exports.notify = function(req, res, next){
  res.render('home/notify', { layout: 'layouts/blank' });
};


// auth
exports.auth_signin = auth_controller.signin;
exports.auth_signout = auth_controller.signout;
exports.auth_signup = auth_controller.signup;

exports.auth_authenticate = auth_controller.authenticate;

// people
exports.people_index = people_controller.index;
exports.people_profile = people_controller.profile;
exports.people_set = people_controller.set;
exports.people_set_password = people_controller.set_password;
exports.people_destroy = people_controller.destroy;

// upload
exports.upload = upload_controller.upload;

// asset
exports.assets_index = assets_controller.index;
exports.assets_destroy = assets_controller.destroy;

// topics
exports.topics_index = topics_controller.index;
exports.topics_show = topics_controller.show;
exports.topics_new = topics_controller.new;
exports.topics_create = topics_controller.create;
exports.topics_edit = topics_controller.edit;
exports.topics_update = topics_controller.update;
exports.topics_destroy = topics_controller.destroy;

// tags
exports.tags_index = tags_controller.index;
exports.tags_new = tags_controller.new;
exports.tags_create = tags_controller.create;
exports.tags_edit = tags_controller.edit;
exports.tags_update = tags_controller.update;
exports.tags_destroy = tags_controller.destroy;

// comments
exports.comments_index = comments_controller.index;
exports.comments_create = comments_controller.create;
exports.comments_destroy = comments_controller.destroy;


// less to css app
var http = require('http')
  , url = require('url')
  , path = require('path')
  , fs = require('fs')
  , less = require('less')
  , public_dir = __dirname + '/../public';
exports.less_css = function(req, res, next){
  var pathname = url.parse(req.url).pathname
    , file_path = path.normalize(public_dir + pathname)
    , dir_name = path.dirname(file_path)
    , ext_name = path.extname(file_path)
    , base_name = path.basename(file_path);

  // 自动匹配与css文件对应的less文件
  if(ext_name.length > 1 && ext_name === '.css'){
    base_name = path.basename(file_path, '.css');
    file_path = path.normalize(dir_name + '/' + base_name + '.less');
  }

  //console.log('\nrequest for [ ' + pathname + ' ] received');

  path.exists(file_path, function(exists){
    if(!exists){
      console.log('file not found:\n' + file_path);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write('file not found: ' + file_path);
      res.end();
    }
    else{
      //console.log('file was matching:\n[ ' + file_path + ' ]');
      fs.readFile(file_path, 'utf-8', function(err, file){
        if(err){
          console.log('read file error:\n' + err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end('read file error.');
        }
        else{
          //console.log('file dir:\n' + dir_name);
          less.render(file, { paths: [dir_name] }, function(err, css){
            if(err){
              console.dir(err);
              res.writeHead(500, { "Content-Type": "text/plain" });
              res.end('parse css error.');
              return;
            }
            
            res.writeHead(200, { "Content-Type": "text/css" });
            res.write(css, 'utf-8');
            res.end();
          });
        }
      });
    }
  });
}

// markdown file
exports.md_html = function(req, res, next){
  var ext = req.params.format;

  var urlPath = [
    'markdown/',
    req.params.title
  ]

  if(ext == 'html' || ext == 'htm'){
    urlPath.push('.md');
  }
  else{
    urlPath.push('.' + ext);
  }
  urlPath = urlPath.join('');
  console.log('urlPath: ' + urlPath);

  var filePath = path.normalize('./views/' + urlPath);

  console.log('filePath: ' + filePath);

  path.exists(filePath, function(exists){
    //console.log(exists);
    if(!exists){
      next();
    }else{
      res.render(urlPath, {layout: false});
    }
  });
}