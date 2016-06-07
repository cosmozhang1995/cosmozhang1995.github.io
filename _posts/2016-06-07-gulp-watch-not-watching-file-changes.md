---
layout: post
title: Gulp watch not watching file changes [Solved]
pagetype: post
author: Cosmo
date: 2016-06-07 14:23:24 +0800
---

My gulp-watch task has been started normally. But it seems like gulp can't detect that my files was changed.

#### Problem

This comes from my question on Stack-Overflow:

[<fakeholder target="_href"></fakeholder>http://stackoverflow.com/questions/37665845/gulp-watch-not-watching-file-changes](http://stackoverflow.com/questions/37665845/gulp-watch-not-watching-file-changes)

My gulp-watch task has been started normally, and the gulp command didn't exit too, every seems good. However, when I make changes to my files, I can't see the changes in my output files, and there was nothing logged in the command line. It seems like gulp can't detect that my files was changed. But running the watched tasks alone will work. 

It is strange. My watch task was working perfectly before. But I can't remember what did I do after the last right run.

Here is my directory structure (part of it):

    ├── README.md
    ├── bower.json
    ├── config.xml
    ├── gulpfile.js
    ├── ionic.project
    ├── src
    │   ├── jade
    │   │   ├── index.jade
    │   │   └── templates/
    │   ├── js
    │   │   ├── app.js
    │   │   ├── modules/
    │   │   └── services/
    │   └── scss
    │       └── ionic.app.scss
    └── www
        ├── README.md
        ├── css
        │   ├── ionic.app.css
        │   ├── ionic.app.min.css
        │   └── style.css
        ├── index.html
        ├── js
        │   └── app.js
        └── templates
            ├── about.html
            ├── home.html
            ├── tabs.html
            └── test.html

Here is my `gulpfile.js`:

{% highlight javascript %}
var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var jade = require('gulp-jade');
var sh = require('shelljs');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var paths = {
  sass: ['./src/scss/**/*.scss'],
  jade: ['./src/jade/**/*.jade'],
  js: ['./src/js/**/*.js']
};

gulp.task('default', ['sass', 'templates', 'scripts', 'watch']);

gulp.task('sass', function(done) {
  gulp.src('./src/scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('templates', function (done) {
  gulp.src('./src/jade/**/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./www/'));
});

gulp.task('scripts', function (done) {
  var bundleStream = browserify('./src/js/app.js').bundle();
  bundleStream
    .pipe(source('app.js'))
    .pipe(rename('app.js'))
    .pipe(gulp.dest('./www/js/'));
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.jade, ['templates']);
  gulp.watch('./src/js/app.js', ['scripts']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
{% endhighlight %}

#### Analyze

I have solved this on my self. The problem is that I declared the `done` argument to my task handler, but I didn't call it. Because of this, the tasks won't finish, and the `watch` task will not work until all previous tasks will work. (I guess without referring to the documents).

#### Wrong Practice

With my `gulpfile.js` in the question, the `gulp` command line will looks like following:

    cosmozhang:bowuguan $ gulp 
    [13:44:36] Using gulpfile ~/work/cordova/bowuguan/gulpfile.js
    [13:44:36] Starting 'sass'...
    [13:44:36] Starting 'templates'...
    [13:44:36] Starting 'scripts'...
    [13:44:36] Starting 'watch'...
    [13:44:36] Finished 'watch' after 16 ms
    [13:44:36] Finished 'sass' after 801 ms

Look at the old `gulpfile.js`, the `done` callback was called in the `sass` task, but was not called in the `templates` and `scripts` task. So only the `sass` task was finished, and we cannot see the finish message of `templates` and `scripts`.

#### Good Practice

Now with my new `gulpfile.js` like this:

{% highlight javascript %}
var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var jade = require('gulp-jade');
var sh = require('shelljs');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var paths = {
  sass: ['./src/scss/**/*.scss'],
  jade: ['./src/jade/**/*.jade'],
  js: ['./src/js/**/*.js']
};

gulp.task('default', ['sass', 'templates', 'scripts', 'watch']);

gulp.task('sass', function(done) {
  gulp.src('./src/scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('templates', function (done) {
  gulp.src('./src/jade/**/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./www/'))
    .on('end', done);
});

gulp.task('scripts', function (done) {
  var bundleStream = browserify('./src/js/app.js').bundle();
  bundleStream
    .pipe(source('app.js'))
    .pipe(rename('app.js'))
    .pipe(gulp.dest('./www/js/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.jade, ['templates']);
  gulp.watch('./src/js/app.js', ['scripts']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
{% endhighlight %}

This time the `gulp` command outputs this:

    cosmozhang:bowuguan $ gulp 
    [13:58:20] Using gulpfile ~/work/cordova/bowuguan/gulpfile.js
    [13:58:20] Starting 'sass'...
    [13:58:20] Starting 'templates'...
    [13:58:20] Starting 'scripts'...
    [13:58:20] Starting 'watch'...
    [13:58:20] Finished 'watch' after 18 ms
    [13:58:20] Finished 'templates' after 135 ms
    [13:58:20] Finished 'scripts' after 170 ms
    [13:58:21] Finished 'sass' after 778 ms
    [13:58:21] Starting 'default'...
    [13:58:21] Finished 'default' after 4.06 μs
    [14:02:22] Starting 'templates'...
    [14:02:22] Finished 'templates' after 75 ms

At 13:58:20, all the tasks were started. And all of them were finished in a second, as I called the `done` callback in all tasks. Then, on 14:02:22, I modified my `index.jade` file and the `templates` task started and finished immediately.

#### Conclusion:

1. If you encountered the problem that your `gulp-watch` task doesn't watch your changes with no outputs, you may check your command line outputs to ensure that all the previous tasks were finished. `gulp-watch` will not work until all the previous tasks were finished.

2. If a task doesn't finish as you expected, you can check your task handler funtion in `gulpfile.js`. Make sure that the function takes no argument. If it takes any argument, the first argument will be regarded as the callback function, and the task will not end until you call the callback. That means your task declaration should looks like one of the following 3 forms:

No argument:

{% highlight javascript %}
gulp.task('templates', function () {  // takes no argument
    ...
});
{% endhighlight %}

With arguments:

{% highlight javascript %}
gulp.task('templates', function (done, ...) {  // takes a argument or more
    ...
    done();  // call the callback
});
{% endhighlight %}

With arguments:

{% highlight javascript %}
gulp.task('templates', function (done, ...) {  // takes a argument or more
    ...
    gulp
        ...
        .on('end', done);  // set the callback argument as gulp's end callback
});
{% endhighlight %}