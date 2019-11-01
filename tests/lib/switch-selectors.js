var tape = require("tape");

var switchesSelectors = require("../../lib/switches-selectors.js");
var noop = require("../../lib/util/noop");

var pjax = {
  onSwitch: function() {
    console.log("Switched");
  },
  state: {},
  log: noop
};

// @author darylteo
tape("test switchesSelectors", function(t) {
  // switchesSelectors relies on a higher level function callback
  // should really be passed in instead so I'll leave it here as a TODO:
  var tmpEl = document.implementation.createHTMLDocument();

  // a div container is used because swapping the containers
  // will generate a new element, so things get weird
  // using "body" generates a lot of testling cruft that I don't
  // want so let's avoid that
  var container = document.createElement("div");
  container.innerHTML = "<p>Original Text</p><span>No Change</span>";
  document.body.appendChild(container);

  var container2 = tmpEl.createElement("div");
  container2.innerHTML = "<p>New Text</p><span>New Span</span>";
  tmpEl.body.appendChild(container2);

  switchesSelectors.bind(pjax)(
    {}, // switches
    {}, // switchesOptions
    ["p"], // selectors,
    tmpEl, // fromEl
    document, // toEl,
    {} // options
  );

  t.equals(
    container.innerHTML,
    "<p>New Text</p><span>No Change</span>",
    "Elements correctly switched"
  );

  t.end();
});

tape("test switchesSelectors when number of elements don't match", function(t) {
  var newTempDoc = document.implementation.createHTMLDocument();
  var originalTempDoc = document.implementation.createHTMLDocument();

  // a div container is used because swapping the containers
  // will generate a new element, so things get weird
  // using "body" generates a lot of testling cruft that I don't
  // want so let's avoid that
  var container = originalTempDoc.createElement("div");
  container.innerHTML = "<p>Original text</p><span>No change</span>";
  originalTempDoc.body.appendChild(container);

  var container2 = newTempDoc.createElement("div");
  container2.innerHTML =
    "<p>New text</p><p>More new text</p><span>New span</span>";
  newTempDoc.body.appendChild(container2);

  var switchSelectorsFn = switchesSelectors.bind(
    pjax,
    {}, // switches
    {}, // switchesOptions
    ["p"], // selectors,
    newTempDoc, // fromEl
    originalTempDoc, // toEl,
    {} // options
  );

  t.throws(
    switchSelectorsFn,
    null,
    "error was thrown properly since number of elements don't match"
  );

  t.end();
});
