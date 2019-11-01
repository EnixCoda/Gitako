var tape = require("tape");

var parseOptions = require("../../lib/parse-options.js");

tape("test parse initalization options function", function(t) {
  t.test("- default options", function(t) {
    var pjax = {};
    pjax.options = parseOptions({});

    t.equal(pjax.options.elements, "a[href], form[action]");
    t.equal(pjax.options.selectors.length, 2, "selectors length");
    t.equal(pjax.options.selectors[0], "title");
    t.equal(pjax.options.selectors[1], ".js-Pjax");

    t.equal(typeof pjax.options.switches, "object");
    t.equal(Object.keys(pjax.options.switches).length, 2); // head and body

    t.equal(typeof pjax.options.switchesOptions, "object");
    t.equal(Object.keys(pjax.options.switchesOptions).length, 0);

    t.equal(pjax.options.history, true);
    t.equal(typeof pjax.options.analytics, "function");
    t.equal(pjax.options.scrollTo, 0);
    t.equal(pjax.options.scrollRestoration, true);
    t.equal(pjax.options.cacheBust, true);
    t.equal(pjax.options.debug, false);
    t.equal(pjax.options.currentUrlFullReload, false);
    t.end();
  });

  // verify analytics always ends up as a function even when passed not a function
  t.test("- analytics is a function", function(t) {
    var pjax = {};
    pjax.options = parseOptions({ analytics: "some string" });

    t.deepEqual(typeof pjax.options.analytics, "function");
    t.end();
  });

  // verify that the value false for scrollTo is not squashed
  t.test("- scrollTo remains false", function(t) {
    var pjax = {};
    pjax.options = parseOptions({ scrollTo: false });

    t.deepEqual(pjax.options.scrollTo, false);
    t.end();
  });

  t.end();
});
