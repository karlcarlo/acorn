/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , markdown = require('node-markdown').Markdown
  , access_log = fs.createWriteStream('./logs/access.log', {flags: 'a'})
  , error_log = fs.createWriteStream('./logs/error.log', {flags: 'a'})

var config = require('./config')

var helpers = require('./helpers');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || config.application.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger({stream: access_log}));
  app.use(express.bodyParser({ uploadDir: './tmp' }));
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.session.secret));
  app.use(express.session({ secret: config.session.secret }));
  app.use(routes.auth_authenticate);
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});



app.configure('development', function(){
  app.use(express.errorHandler());
});

app.locals({
  title: config.application.title,
  version: config.application.version,
  messages: []
})

// Routes
app.get('/', routes.index);
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
app.put('/people/:id/set_active', routes.people_set_active);

// Upload
app.post('/upload', routes.upload);

// Asset
app.get('/assets.:format?', routes.assets_index);
app.del('/assets/:id/delete', routes.assets_destroy);

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
app.put('/tags/:id', routes.tags_update);
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

http.createServer(app).listen(app.get('port'), function(){
  console.log("%s server listening on port %d in %s mode", config.application.name, app.get('port'), app.settings.env);
});
