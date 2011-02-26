var total = 0,
    testing = false,
    fail = false,
    tests = [];

function ok(b, message) {
  if (b) {
    total--;
  } else {
    fail = true;
  }
}
function reset() {
  total = 0;
  fail = false;
  testing = false;
  init();
}
function failure(li, check) {
  check.innerHTML = 'x';
  li.className = 'fail';
  reset();
}
function pass(li, check) {
  check.innerHTML = '√';
  li.className = 'pass';
  reset();
}

function test (name, expect, fn) {
  tests.push({
    name: name,
    expect: expect,
    fn: fn
  });
}

function init () {
  if (tests.length > 0) {
    var o = tests.shift();
    _test(o.name, o.expect, o.fn);
  }
}

function _test(name, expect, fn) {
  total = expect;
  var li = document.createElement('li');
  li.innerHTML = name + ' ... <span>o</span>';
  var start = +new Date;
  var check = li.getElementsByTagName('span')[0];
  document.getElementById('tests').appendChild(li);
  fn();
  setTimeout(function() {
    if (+new Date - start > 10000) {
      failure(li, check);
    } else {
      if (fail) {
        failure(li, check);
      } else if (!total) {
        pass(li, check);
      } else {
        setTimeout(arguments.callee, 50);
      }
    }
  }, 50);
}
