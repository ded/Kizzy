#!/usr/bin/env node
/**
  * building $kizzy.js requires node
  * to install node try "port install node"
  * if that doesn't work. see the instructions
  * https://github.com/ry/node/wiki/Installation
  */
var fs = require('fs'),
    uglifyJs = require('./build/UglifyJS'),
    jshint = require('./build/jshint/jshint').JSHINT,
    gzip = require('./build/gzip/lib/gzip'),

    BUILD_DIR = 'build',
    DIST_DIR = 'dist',
    SRC_DIR = 'src';

console.log("Loading Kizzy source...");

var $kizzy = fs.readFileSync(SRC_DIR + '/kizzy.js', 'UTF-8'),
    header = fs.readFileSync(SRC_DIR + '/header.js', 'UTF-8');

console.log("Testing Kizzy against jshint...");

jshint($kizzy, {
  boss: true,
  forin: true,
  browser: true
});

var errors = [];
jshint.errors.forEach(function (err) {
  //ignore these errors until jshint resolves https://github.com/jshint/jshint/issues#issue/20
  if (err.reason != 'Expected an assignment or function call and instead saw an expression.') {
    errors.push(err);
  }
});

if (!errors.length) {
  console.log('Congratulations. No Errors. <3 JSHint.');
} else {
  console.log(
      'JSHint is NOT happy with '
      + errors.length
      + ' thing' + (errors.length > 1 ? 's' : '')
      + '!'
  );
  errors.forEach(function (err) {
    console.log(err.id + " line " + err.line + ": " + err.reason);
  });
  console.log('---------------------------------');
}

var $oldFile = fs.readFileSync(DIST_DIR + '/kizzy.min.js', 'UTF-8');
var ast = uglifyJs.parser.parse($kizzy); // parse code and get the initial AST
ast = uglifyJs.uglify.ast_mangle(ast); // get a new AST with mangled names
ast = uglifyJs.uglify.ast_squeeze(ast); // get an AST with compression optimizations
var $kizzyUgly = uglifyJs.uglify.gen_code(ast);

console.log('Kizzy minified with UglifyJs');

try {
  fs.statSync(DIST_DIR);
} catch (e) {
  fs.mkdirSync(DIST_DIR, 0775);
}

var $uglyFile = [header, $kizzyUgly].join('');
fs.writeFileSync(DIST_DIR + '/kizzy.js', [header, $kizzy].join('\n'));
fs.writeFileSync(DIST_DIR + '/kizzy.min.js', $uglyFile);


//gzip everything
console.log('gzipping...');
gzip($oldFile, function(err, data){
  var oldLen = $oldFile.length,
    oldGzipLen = data.length;
    gzip($uglyFile, function(err, data){
      var newLen = $uglyFile.length,
      newGzipLen = data.length;
      messageLength(oldLen, oldGzipLen, newLen, newGzipLen);
    });
});

function messageLength(oldLen, oldGzipLen, newLen, newGzipLen){
  var fileDiff = Math.abs(oldLen - newLen),
    gzipDiff = oldGzipLen - newGzipLen,
    gzipMsg = '(' + Math.abs(gzipDiff) + ' ' + (gzipDiff < 0 ? 'more' : 'less') + ' gzipped.)';

  console.log("Done! kizzy.js is now " + newLen + ' bytes. (Only ' + newGzipLen + ' gzipped.)');
  if (newLen < oldLen) {
    console.log('You are a very special, handsome person. Now go do a shot of whiskey');
    console.log('That\'s ' + fileDiff + ' bytes less! ' + gzipMsg);
  } else if (newLen > oldLen) {
    console.log('Dude! You made it worse!');
    console.log('That\'s ' + fileDiff + ' bytes more! ' + gzipMsg);
  } else {
    console.log('Not bad. But how does it feel to do all that work and make no difference');
  }
};