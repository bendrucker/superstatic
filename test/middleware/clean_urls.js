var connect = require('connect');
var http = require('http');
var request = require('supertest');
var cleanUrls = require('../../lib/middleware/clean_urls');
var defaultSettings = require('../../lib/settings/default');
var query = require('connect-query');
var PORT = '7777';

describe('clean urls middleware', function () {
  var settings;
  var server;
  var app;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    settings.configuration.clean_urls = true;
    
    app.use(function (req, res, next) {
      res.send = function (pathname) {
        res.writeHead(200);
        res.end(pathname);
      };
      req.config = settings.configuration;
      
      next();
    });
  });
  
  it('redirects to the clean url path when static html file is requested', function (done) {
    app.use(cleanUrls(settings));
    
    request(app)
      .get('/superstatic.html')
      .expect('Location', '/superstatic')
      .expect(301)
      .end(done);
  });
  
  it('it redirects and keeps the query string', function (done) {
    app.use(query());
    app.use(cleanUrls(settings));
    
    request(app)
      .get('/superstatic.html?key=value')
      .expect('Location', '/superstatic?key=value')
      .expect(301)
      .end(done);
  });
  
  it('serves the .html version of the clean url if clean_urls are on', function (done) {
    app.use(cleanUrls(settings));
    
    request(app)
      .get('/superstatic')
      .expect(200)
      .expect('/superstatic.html')
      .end(done);
  });
  
  it('sets default root if no root is defined in config', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        res.send = function (pathname) {
          res.writeHead(200);
          res.end(pathname);
        };
        req.config = {};
        next();
      })
      .use(cleanUrls(settings));
     
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('sets the default root if no root in config and no root in settings', function (done) {
    delete settings.configuration;
    
    var app = connect()
      .use(function (req, res, next) {
        res.send = function (pathname) {
          res.writeHead(200);
          res.end(pathname);
        };
        req.config = {};
        next();
      })
      .use(cleanUrls(settings));
     
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  describe('skips middleware', function() {
    
    beforeEach(function () {
      app.use(function (req, res, next) {
        req.config.clean_urls = false;
        next();
      });
    });
    
    it('skips the middleware if clean_urls are turned off', function (done) {
      app.use(cleanUrls(settings));
      
      request(app)
        .get('/superstatic.html')
        .expect(404)
        .end(done);
    });
    
    it('skips the middleware if the clean_urls value is a stringed version of false', function (done) {
      app
        .use(function (req, res, next) {
          req.config.clean_urls = 'false';
          next();
        })
        .use(cleanUrls(settings));
      
      request(app)
        .get('/superstatic.html')
        .expect(404)
        .end(done);
    });
    
    it('skips the middleware if it is the root path', function (done) {
      app.use(cleanUrls(settings));
      
      request(app)
        .get('/')
        .expect(404)
        .end(done);
    });
    
    it('skips the middleware if it is not a file and clean_urls are on', function (done) {
      settings.isFile = function () {return false;}
      
      app.use(function (req, res, next) {
        req.config.clean_urls = true;
        next();
      });
      app.use(cleanUrls(settings));
      
      request(app)
        .get('/superstatic')
        .expect(404)
        .end(done);
    });
    
    it('skips the middleware if there is no config available', function (done) {
      app.use(function (req, res, next) {
        delete req.config
        next();
      });
      app.use(cleanUrls(settings));
      
      request(app)
        .get('/superstatic')
        .expect(404)
        .end(done);
    });
  });
});