var tape = require("tape");

var forEachEls = require("../../lib/foreach-els.js");

var div = document.createElement("div");
var span = document.createElement("span");
var cb = function(el) {
  el.innerHTML = "boom";
};

tape("test forEachEls on one element", function(t) {
  div.innerHTML = "div tag";
  forEachEls(div, cb);

  t.equal(div.innerHTML, "boom", "works correctly on one element");
  t.end();
});

tape("test forEachEls on an array", function(t) {
  div.innerHTML = "div tag";
  span.innerHTML = "span tag";

  forEachEls([div, span], cb);

  t.equal(
    div.innerHTML,
    "boom",
    "works correctly on the first element of the array"
  );
  t.equal(
    span.innerHTML,
    "boom",
    "works correctly on the last element of the array"
  );

  t.end();
});

tape("test forEachEls on a NodeList", function(t) {
  div.innerHTML = "div tag";
  span.innerHTML = "span tag";

  var frag = document.createDocumentFragment();
  frag.appendChild(div);
  frag.appendChild(span);
  forEachEls(frag.childNodes, cb);

  t.equal(
    div.innerHTML,
    "boom",
    "works correctly on the first element of the document fragment"
  );
  t.equal(
    span.innerHTML,
    "boom",
    "works correctly on the last element of the document fragment"
  );

  t.end();
});
