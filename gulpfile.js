var gulp = require('gulp')
  , less = require('gulp-less-sourcemap')
  , path = require('path')
  , minifyCSS = require('gulp-minify-css')
  , concat = require('gulp-concat')
  , stripDebug = require('gulp-strip-debug')
  , jshint = require('gulp-jshint')
  , uglify = require('gulp-uglify')
  , prefix = require('gulp-autoprefixer')
  , sourcemaps = require('gulp-sourcemaps')
  , htmlmin = require('gulp-htmlmin')
  , serve = require('gulp-serve')
  , livereload = require('gulp-livereload');

var scripts = [
            './src/scripts/angular.js'
          , './src/scripts/app.js'
          , './src/scripts/vendor/*.js'
          , './src/scripts/directives/*.js'
          , './src/scripts/services/*.js'
          , './src/scripts/filters/*.js'
          , './src/scripts/siren/*.js'
          , './src/scripts/controllers/*.js'
        ];

var zettaScripts = [
          , './src/scripts/app.js'
          , './src/scripts/directives/*.js'
          , './src/scripts/services/*.js'
          , './src/scripts/filters/*.js'
          , './src/scripts/siren/*.js'
          , './src/scripts/controllers/*.js'
        ];



gulp.task('jshint', function() {
  
  gulp.src(zettaScripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
  
});

gulp.task('scripts', function() {
  gulp.src(scripts)
  /*  .pipe(sourcemaps.init()) */
      .pipe(concat('zetta.js'))
  /*  .pipe(stripDebug()) */
      .pipe(uglify({mangle:false})) //remove mangle.false to further reduce filesize of the production JS file. about a 30% savings
  /*  .pipe(sourcemaps.write('./'))  */
      .pipe(gulp.dest('./dist/scripts'))
});

gulp.task('styles',['css'], function() {
  gulp.src('./src/styles/styles.less')
    .pipe(less({
      generateSourceMap: true, 
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./src/styles'));
  
 
});

gulp.task('css', function() {
  gulp.src([
       './src/styles/pure.css'
      ,'./src/styles/grids-responsive.css'
      ,'./src/styles/prism.css'
      ,'./src/styles/animate.css'  
      ,'./src/styles/styles.css'
    ])
    /*.pipe(sourcemaps.init())*/
    /*.pipe(prefix("last 2 version", "> 5%", "ie 9")) */
      .pipe(concat('zetta.css'))
      .pipe(minifyCSS({noAdvanced:true, keepSpecialComments: 0})) 
    /*.pipe(sourcemaps.write('./'))*/
    .pipe(gulp.dest('./dist/styles'));
  
});
  
gulp.task('html', function() {
  gulp.src('./src/*.html')
    /*.pipe(sourcemaps.init())*/
      .pipe(htmlmin({
        useShortDoctype: true
        , removeRedundantAttributes: true
      /*, collapseWhitespace: true
        , conservativeCollapse: true */
      }))
    /*.pipe(sourcemaps.write())*/
    .pipe(gulp.dest('./dist'))
});

gulp.task('move', function() {
  gulp.src(['./src/favicon.ico']).pipe(gulp.dest('./dist'));
  gulp.src(['./src/index.html']).pipe(gulp.dest('./dist'));
  gulp.src(['./src/images/*.*']).pipe(gulp.dest('./dist/images'));
  gulp.src(['./src/partials/*.*']).pipe(gulp.dest('./dist/partials'));
  gulp.src('./src/styles/fonts/*.*').pipe(gulp.dest('./dist/fonts'));
});

gulp.task('serve', serve({
    root: 'dist',
    port: 3001
}));

gulp.task('default', ['scripts', 'styles', 'move', 'serve'], function(){
  //gulp.watch(zettaScripts, ['jshint']);
  gulp.watch(scripts, ['scripts']);
  gulp.watch('./src/styles/*.*', ['styles']);
  gulp.watch(['./src/index.html', './src/images/*.*', './src/partials/*.*'], ['move']);

});


