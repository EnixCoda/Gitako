var tape = require("tape");

var uniqueid = require("../../lib/uniqueid.js");

tape("test uniqueid", function(t) {
  var a = uniqueid();
  var b = uniqueid();

  t.notEqual(a, b, "Two calls to uniqueid produce different values");

  t.end();
});
