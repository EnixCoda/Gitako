var tape = require("tape");

var clone = require("../../../lib/util/clone");

tape("test clone method", function(t) {
  var obj = { one: 1, two: 2 };
  var cloned = clone(obj);

  t.notEqual(obj, cloned, "cloned object isn't the original object");

  t.same(obj, cloned, "cloned object has the same values as original object");

  cloned.three = 3;
  t.notSame(
    obj,
    cloned,
    "modified cloned object doesn't have the same values as original object"
  );

  t.end();
});
