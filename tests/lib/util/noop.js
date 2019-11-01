var tape = require("tape");

var noop = require("../../../lib/util/noop");

tape("test noop function", function(t) {
  t.equal(typeof noop, "function", "noop is a function");
  t.equal(noop(), undefined, "noop() returns nothing");
  t.end();
});
