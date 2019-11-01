var tape = require("tape");

var contains = require("../../../lib/util/contains.js");

tape("test contains function", function(t) {
  var tempDoc = document.implementation.createHTMLDocument();
  tempDoc.body.innerHTML =
    "<div><p id='el' class='js-Pjax'></p></div><span></span>";
  var selectors = ["div"];
  var el = tempDoc.body.querySelector("#el");
  t.equal(
    contains(tempDoc, selectors, el),
    true,
    "contains() returns true when a selector contains the element"
  );

  selectors = ["span"];
  t.equal(
    contains(tempDoc, selectors, el),
    false,
    "contains() returns false when the selectors do not contain the element"
  );

  t.end();
});
