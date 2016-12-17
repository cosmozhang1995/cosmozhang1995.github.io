// self defined auto tasks

var gulp = require('gulp');
gulp.scp = require('gulp-scp2');

var task_configs = require('./task-config');

var scpTransConf = task_configs.autoScp;
var scpTasks = [];
for (var i = 0; i < scpTransConf.length; i++) {
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
		console.log(scpOptions);
		gulp.src(transConfItem.localFiles).pipe(gulp.scp(scpOptions));
	});
	scpTasks.push({
		name: taskName,
		localFiles: transConfItem.localFiles
	});
}

var watchTasks = [];
for (var i = 0; i < scpTasks.length; i++) watchTasks.push(scpTasks[i].name);
gulp.task('watch', watchTasks, function () {
	for (var i = 0; i < scpTasks.length; i++) {
		var taskItem = scpTasks[i];
		gulp.watch(taskItem.localFiles, [taskItem.name]);
	}
});