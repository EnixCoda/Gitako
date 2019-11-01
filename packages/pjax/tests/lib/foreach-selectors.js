var tape = require("tape");

var forEachEls = require("../../lib/foreach-selectors.js");

var cb = function(el) {
  el.className = "modified";
};

tape("test forEachSelector", function(t) {
  forEachEls(["html", "body"], cb);

  t.equal(
    document.documentElement.className,
    "modified",
    "callback has been executed on first selector"
  );
  t.equal(
    document.body.className,
    "modified",
    "callback has been executed on first selector"
  );

  document.documentElement.className = "";
  document.body.className = "";

  forEachEls(["html", "body"], cb, null, document.documentElement);

  t.equal(
    document.documentElement.className,
    "",
    "callback has not been executed on first selector when context is used"
  );
  t.equal(
    document.body.className,
    "modified",
    "callback has been executed on first selector when context is used"
  );

  t.end();
});
