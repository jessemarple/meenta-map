const gulp = require('gulp')
const concatCss = require('gulp-concat-css')
const sourcemaps = require('gulp-sourcemaps')
const concat = require('gulp-concat')
const uglify = require('gulp-uglifyjs')
const gutil = require('gulp-util')
const batch = require('gulp-batch')
const watch = require('gulp-watch')

gulp.task('css', function () {

  return gulp.src('assets/css/*.css')
    .pipe(concatCss('bundle.css'))
    .pipe(gulp.dest('dist/'))

});

gulp.task('watch', function() {

	watch('assets/js/*.js', batch(function(events, done) {
		gulp.start('app', done);
	}))

});

gulp.task('app', function () {

  var files = [
    './assets/js/jquery-3.3.1.min.js',
    './assets/js/firebase.js',
    './assets/js/bootstrap.min.js',
    './assets/js/mapbox-gl.js',
    './assets/js/mapbox-gl-geocoder.min.js',
    './assets/js/underscore-min.js',
    './assets/js/map.js'
  ];

  return gulp.src(files)
  .pipe(concat('bundle.js'))
  .on('error', function (err) {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest('./dist/'))

});

gulp.task('deploy', function () {

  var files = [
    './assets/js/jquery-3.3.1.min.js',
    './assets/js/firebase.js',
    './assets/js/bootstrap.min.js',
    './assets/js/mapbox-gl.js',
    './assets/js/mapbox-gl-geocoder.min.js',
    './assets/js/underscore-min.js',
    './assets/js/map.js'
  ];

  return gulp.src(files)
  .pipe(concat('bundle.js'))
  .pipe(uglify({ mangle: true, minify: true }))
  .on('error', function (err) {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest('./dist/'))

});
