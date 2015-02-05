var fs = require('fs');
var path = require('path');
var argo = require('argo');
var mime = require('mime');

var startTime = new Date( parseInt(new Date().getTime() / 1000)*1000 );

argo()
  .use(function(handle) {
    handle('response', function(env, next) {
      if (env.response.statusCode === 404) {
        env.response.body = 'Not Found';
      }
      next(env);
    });
  })
  .get('.+', function(handle) {
    handle('request', function(env, next) {
      if (env.request.url === '/' + __filename.split('/').pop() ||
          !!~env.request.url.indexOf('./')) {
        env.response.statusCode = 404;
        return next(env);
      }

      var filename = __dirname + '/dist' + 
        (env.request.url === '/' ? '/index.html' : env.request.url)

      if(env.request.headers['if-modified-since']) {
        var d = new Date(env.request.headers['if-modified-since']);
        if (startTime.getTime() <= d.getTime()) {
          env.response.statusCode = 304;
          return next(env);
        }
      }
      

      fs.stat(filename, function(err, stat) {
        if (err) {
          env.response.statusCode = 404;
          return next(env);
        }

        var stream = fs.createReadStream(filename);
        env.response.setHeader('Content-Type', mime.lookup(filename));
        env.response.setHeader('Cache-Control', 'public, max-age=31536000');
        env.response.setHeader('Last-Modified', startTime);

        env.response.body = stream;
        next(env);
      });
    });
  })
  .listen(process.env.PORT || 3001);
