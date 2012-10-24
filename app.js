/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , markdown = require('node-markdown').Markdown
  , path = require('path')
  , config = require('./config').config;

var helpers = require('./helpers');

var app = module.exports = express.createServer();

// Configuration
app.register('.md', {
  compile: function(str, options){
    var html = markdown(str);
    return function(locals){
      return html.replace(/\{([^}]+)\}/g, function(_, name){
        return locals[name];
      });
    };
  }
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: 'layouts/layout'
  });
  //app.use(express.compiler({ src: __dirname + '/public/stylesheets', enable: ['less'] }));
	app.use(express.cookieParser());
	app.use(express.session({
		secret: config.session.secret,
	}));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser({ uploadDir: './tmp' }));
  app.use(express.methodOverride());

  app.use(routes.auth_authenticate);
  app.use(app.router);
});



app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	var one_year = 365 * 24 * 60 * 60 * 1000;
	app.set('view cache', true);
	app.use(express.static(__dirname + '/public', { maxAge: one_year }));
	app.use(express.errorHandler()); 
});

app.helpers({
  title: 'Acorn Blog',
  version: config.application.version
});

app.dynamicHelpers({
  messages: function(req, res){
    return req.flash();
  }
});

// Routes
app.get('/', routes.index);
app.get('/stylesheets/:name.css', routes.less_css);
app.get('/markdown/:title.:format', routes.md_html);
app.get('/notify', routes.notify);

// Auth
app.get('/signin', routes.auth_signin);
app.get('/signout', routes.auth_signout);
app.get('/signup', routes.auth_signup);
app.post('/signin', routes.auth_signin);
app.post('/signup', routes.auth_signup);

// Person
app.get('/people.:format?', routes.people_index);
app.get('/profile', routes.people_profile);
app.get('/set', routes.people_set);
app.post('/set', routes.people_set);
app.get('/set_password', routes.people_set_password);
app.post('/set_password', routes.people_set_password);
app.del('/people/:id/delete', routes.people_destroy);

// Upload
app.post('/upload', routes.upload);

// Asset
app.get('/assets.:format?', routes.assets_index);
app.post('/assets/:id/delete', routes.assets_destroy);

// Topic
app.get('/topics.:format?', routes.topics_index);
app.get('/topics/new', routes.topics_new);
app.get('/topics/:id', routes.topics_show);
app.get('/topics/:id/edit', routes.topics_edit);
app.post('/topics', routes.topics_create);
app.post('/topics/:id', routes.topics_update)
app.del('/topics/:id/delete', routes.topics_destroy);

// Tag
app.get('/tags.:format?', routes.tags_index);
app.get('/tags/new', routes.tags_new);
app.get('/tags/:id/edit', routes.tags_edit);
app.post('/tags', routes.tags_create);
app.post('/tags/:id', routes.tags_update);
app.del('/tags/:id/delete', routes.tags_destroy);

// Comment
app.get('/comments.:format?', routes.comments_index);
app.post('/comments', routes.comments_create);
app.del('/comments/:id/delete', routes.comments_destroy);

// finalize route
app.get('*', function(req, res){
  console.log('page not found (404 handler) - ' + (new Date).toString());
  res.render('home/404', {
    status: 404,
    title: config.application.name,
    layout: 'layouts/blank'
  });
});

app.listen(config.application.port);
console.log("%s server listening on port %d in %s mode", config.application.name, config.application.port, app.settings.env);