var gulp = require('gulp')
var bufferify = require('gulp-bufferify').default
var babel = require('gulp-babel')

gulp.src('src/hello-events.js')
  .pipe(babel())
  .pipe(bufferify(function(content) {

    content = content.replace(/Object\.defineProperty\(exports,[\s\S]+?\);/gm, '')
    content = content.replace(`exports.default = HelloEvents;`, '')
    content = `
!function(root) {

${content}

if (typeof define === 'function' && (define.cmd || define.amd)) { // amd | cmd
  define(function(require, exports, module) {
    module.exports = HelloEvents;
  });
}
else if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelloEvents;
}
else {
  root.HelloEvents = HelloEvents;
}

} (this || window);
    `
    content = content.trim()
    content += "\n"

    return content
  }))
  .pipe(gulp.dest('dist'))
