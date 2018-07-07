var gulp = require('gulp')
var bufferify = require('gulp-bufferify').default
var babel = require('gulp-babel')
var namespace = 'HelloEvents'

gulp.src('src/hello-events.js')
  .pipe(babel({
    presets: [
      ['env']
    ],
    plugins: [
      'transform-async-to-promises',
      'transform-es2015-classes',
    ]
  }))
  .pipe(bufferify(function(content) {

    content = content.replace(/Object\.defineProperty\(exports,[\s\S]+?\);/gm, '')
    content = content.replace(`exports.default = ${namespace};`, '')
    content = `
!function(root) {

${content}

if (typeof define === 'function' && (define.cmd || define.amd)) { // amd | cmd
  define(function(require, exports, module) {
    module.exports = ${namespace};
  });
}
else if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${namespace};
}
else {
  root.${namespace} = ${namespace};
}

} (this || window);
    `
    content = content.trim()
    content += "\n"

    return content
  }))
  .pipe(gulp.dest('dist'))