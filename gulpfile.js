const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-dart-sass');
const sassGlob = require("gulp-sass-glob");
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const size = require('gulp-size');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync');

const pkg = require('./package.json');

function css() {
  return src(pkg.path.scss + '**/*.scss')
    // .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(sassGlob()) // Sassの@importにおけるglobを有効にする
    .pipe(sass({
      outputStyle: 'expanded', // nested, compact, compressed, expanded
      // sourceComments : 'normal',
      errLogToConsole: true
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer({
      grid: true
    })]))
    .pipe(dest('./dist/styles')
  );
}

const html = () => {
  return src(
    [pkg.path.html + '**/*.ejs', '!' + pkg.path.html + '**/_*.ejs']
  )
  // .pipe(plumber({
  //   errorHandler: notify.onError("Error: <%= error.message %>")
  // }))
  .pipe(ejs({}, {}, {ext:'.html'}))
  // .pipe(ejs({}, {}, { ext: '.html' }))
  .pipe(rename({ extname: ".html" }))
  .pipe(dest('./dist/html')
  );
}

function image() {
  return src(['./src/images/**/*.{png,gif,svg,jpg}', '!./src/images/sprite/**/*.{png,gif,svg,jpg}'])
    .pipe(size())
    .pipe(imagemin(
      [pngquant({quality: '40-80', speed: 1})]
    ))
    .pipe(imagemin()) //ここでガンマ情報を除去！
    .pipe(size())
    .pipe(dest('./dist/images')
  );
}

function script() {
  return src(pkg.path.script + '*.js')
    .pipe(plumber({
      errorHandler: notify.onError("Error: <%= error.message %>")
    }))
    .pipe(dest('./dist/scripts')
  );
}

const server = () => {
  browserSync.init(browserSyncOption);
}

const browserSyncOption = {
  // proxy: 'http://localhost/',
  server: {
    baseDir: './',
  },
  ghostMode: false,
  open: 'external',
  notify: false,
  scrollProportionally: false,
  reloadOnRestart: true,
}

const browserSyncReload = (done) => {
  browserSync.reload();
  done();
}

const watchFiles = () => {
  watch(pkg.path.scss + '**/*.scss', series(css, browserSyncReload))
  watch(pkg.path.html + '**/*.ejs', series(html, browserSyncReload))
  watch(pkg.path.script + '**/*.js', series(script, browserSyncReload))
}

exports.css = css;
exports.image = image;
exports.html = html;
exports.script = script;
exports.watchFiles = watchFiles;
exports.server = server;
exports.browserSyncReload = browserSyncReload;

exports.default = series(series(css, html, image), parallel(watchFiles, server));