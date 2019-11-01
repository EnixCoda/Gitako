var tape = require("tape");

var extend = require("../../../lib/util/extend");

tape("test extend method", function(t) {
  var obj = { one: 1, two: 2 };

  var extended = extend({}, obj, { two: "two", three: 3 });
  t.notEqual(obj, extended, "extended object isn't the original object");
  t.notSame(
    obj,
    extended,
    "extended object doesn't have the same values as original object"
  );
  t.notSame(
    obj.two,
    extended.two,
    "extended object value overwrites value from original object"
  );

  extended = extend(null);
  t.equals(extended, null, "passing null returns null");

  t.end();
});
