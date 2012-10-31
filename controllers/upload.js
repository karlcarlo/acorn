var config= require('../config').config;

var check = require('validator').check,
  sanitize = require('validator').sanitize;

var models = require('../models'),
  Asset = models.Asset;

var controllers;

var helpers = require('../helpers');

var fs = require('fs')
  , path = require('path');

exports.upload = function(req, res, next){

  var res_obj = {
    success: true,
    message: ''
  };
  /*
  if(!req.session.person){
    res_obj.success = false;
    res_obj.message = '您还未登录，不能上传文件。';
    res.json(res_obj);
    return;
  }
  */
  if(req.method.toLowerCase() == 'post'){

    var file = req.files.file;

    if(file){

      if(file.name == '' || file.size == 0){
        res_obj.success = false;
        res_obj.message = '文件为空。';
        res.json(res_obj);
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
            asset.url = path.join(config.application.host, '/uploads/', filename);

            asset.save(function(err){
              res_obj.file = asset;
              res_obj.message = '文件保存成功。';
              res.json(res_obj);
              return;
            });
          });
        });

    }
    else{
      res_obj.success = false;
      res_obj.message = '参数有误。';
      res.json(res_obj);
      return;
    }

  }
}