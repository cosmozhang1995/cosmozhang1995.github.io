// self defined auto tasks

var gulp = require('gulp');
var sass = require('gulp-sass');

// custom defined tasks

gulp.task('default', ['sass', 'watch']);

gulp.task('sass', function() {
  return gulp.src('public/scss/stylesheet.scss')
    .pipe(sass())
    .pipe(gulp.dest('public/stylesheets'))
});

gulp.task('watch', function() {
  gulp.watch('public/scss/**/*.scss', ['sass']);
});

// watch for file changes and upload to server

var task_configs = require('./task-config');

var scpTransConf = task_configs.autoScp;
var scpTasks = [];
for (var i = 0; i < scpTransConf.length; i++) {
  (function () {
    var transConfItem = scpTransConf[i];
    var taskName = 'autoscp-' + i;
    gulp.task(taskName, function () {
      var scpOptions = {
        host: transConfItem.host,
        port: transConfItem.port || 22,
        username: transConfItem.username || "root",
        password: transConfItem.password || undefined,
        dest: transConfItem.dest
      };
      console.log("scp " + transConfItem.localFiles + " " + scpOptions.username + "@" + scpOptions.host + ":" + scpOptions.dest);
      gulp.src(transConfItem.localFiles).pipe(require('gulp-scp2')(scpOptions));
    });
    scpTasks.push({
      name: taskName,
      localFiles: transConfItem.localFiles
    });
  })();
}

var watchTasks = [];
for (var i = 0; i < scpTasks.length; i++) watchTasks.push(scpTasks[i].name);
gulp.task('scpwatch', watchTasks, function () {
  for (var i = 0; i < scpTasks.length; i++) {
    var taskItem = scpTasks[i];
    gulp.watch(taskItem.localFiles, [taskItem.name]);
  }
});
