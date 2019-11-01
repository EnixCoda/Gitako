var tape = require("tape");

var on = require("../../../lib/events/on");
var trigger = require("../../../lib/events/trigger");
var attachLink = require("../../../lib/proto/attach-link");

var attr = "data-pjax-state";

tape("test attach link prototype method", function(t) {
  var a = document.createElement("a");
  var loadUrlCalled = false;

  attachLink.call(
    {
      options: {},
      loadUrl: function() {
        loadUrlCalled = true;
      }
    },
    a
  );

  var internalUri =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    window.location.search;

  a.href = internalUri;
  trigger(a, "click", { metaKey: true });
  t.equal(a.getAttribute(attr), "modifier", "event key modifier stop behavior");

  a.href = "http://external.com/";
  trigger(a, "click");
  t.equal(a.getAttribute(attr), "external", "external url stop behavior");

  window.location.hash = "#anchor";
  a.href = internalUri + "#anchor";
  trigger(a, "click");
  t.equal(a.getAttribute(attr), "anchor", "internal anchor stop behavior");

  a.href = internalUri + "#another-anchor";
  trigger(a, "click");
  t.equal(a.getAttribute(attr), "anchor", "different anchors stop behavior");
  window.location.hash = "";

  a.href = internalUri + "#";
  trigger(a, "click");
  t.equal(a.getAttribute(attr), "anchor-empty", "empty anchor stop behavior");

  a.href = window.location.protocol + "//" + window.location.host + "/internal";
  trigger(a, "click");
  t.equals(
    a.getAttribute(attr),
    "load",
    "triggering an internal link sets the state attribute to 'load'"
  );
  t.equals(
    loadUrlCalled,
    true,
    "triggering an internal link actually loads the page"
  );

  t.end();
});

tape("test attach link preventDefaulted events", function(t) {
  var loadUrlCalled = false;
  var a = document.createElement("a");

  // This needs to be before the call to attachLink()
  on(a, "click", function(event) {
    event.preventDefault();
  });

  attachLink.call(
    {
      options: {},
      loadUrl: function() {
        loadUrlCalled = true;
      }
    },
    a
  );

  a.href = "#";
  trigger(a, "click");
  t.equal(
    loadUrlCalled,
    false,
    "events that are preventDefaulted should not fire callback"
  );

  t.end();
});

tape("test options are not modified by attachLink", function(t) {
  var a = document.createElement("a");
  var options = { foo: "bar" };
  var loadUrl = function() {};

  attachLink.call({ options: options, loadUrl: loadUrl }, a);

  a.href =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    window.location.search;

  trigger(a, "click");

  t.equal(
    1,
    Object.keys(options).length,
    "options object that is passed in should not be modified"
  );
  t.equal(
    "bar",
    options.foo,
    "options object that is passed in should not be modified"
  );

  t.end();
});

tape("test link triggered by keyboard", function(t) {
  var a = document.createElement("a");
  var pjax = {
    options: {},
    loadUrl: function() {
      t.equal(
        a.getAttribute(attr),
        "load",
        "triggering a internal link actually loads the page"
      );
    }
  };

  t.plan(3);

  attachLink.call(pjax, a);

  a.href = window.location.protocol + "//" + window.location.host + "/internal";

  trigger(a, "keyup", { keyCode: 14 });
  t.equal(
    a.getAttribute(attr),
    "",
    "keycode other than 13 doesn't trigger anything"
  );

  trigger(a, "keyup", { keyCode: 13, metaKey: true });
  t.equal(a.getAttribute(attr), "modifier", "event key modifier stop behavior");

  trigger(a, "keyup", { keyCode: 13 });
  // see loadUrl defined above

  t.end();
});

tape(
  "test link with the same URL as the current one, when currentUrlFullReload set to true",
  function(t) {
    var a = document.createElement("a");
    var pjax = {
      options: {
        currentUrlFullReload: true
      },
      reload: function() {
        t.pass("this.reload() was called correctly");
      },
      loadUrl: function() {
        t.fail("loadUrl() was called wrongly");
      }
    };

    t.plan(2);

    attachLink.call(pjax, a);

    a.href = window.location.href;

    trigger(a, "click");
    t.equal(a.getAttribute(attr), "reload", "reload stop behavior");

    t.end();
  }
);
