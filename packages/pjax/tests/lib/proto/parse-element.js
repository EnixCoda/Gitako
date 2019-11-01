var tape = require("tape");

var parseElement = require("../../../lib/proto/parse-element");

var pjax = {
  attachLink: function() {
    return true;
  },
  attachForm: function() {
    return true;
  }
};

tape("test parse element prototype method", function(t) {
  t.doesNotThrow(function() {
    var a = document.createElement("a");
    parseElement.call(pjax, a);
  }, "<a> element can be parsed");

  t.doesNotThrow(function() {
    var form = document.createElement("form");
    parseElement.call(pjax, form);
  }, "<form> element can be parsed");

  t.throws(function() {
    var el = document.createElement("div");
    parseElement.call(pjax, el);
  }, "<div> element cannot be parsed");

  t.end();
});
