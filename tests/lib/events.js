var tape = require("tape");

var on = require("../../lib/events/on");
var off = require("../../lib/events/off");
var trigger = require("../../lib/events/trigger");

var el = document.createElement("div");
var el2 = document.createElement("span");
var els = [el, el2];

var classCb = function() {
  this.className += "on";
};
var attrCb = function() {
  this.setAttribute("data-state", this.getAttribute("data-state") + "ON");
};

tape("test events on/off/trigger for one element, one event", function(t) {
  el.className = "";
  on(el, "click", classCb);
  trigger(el, "click");
  t.equal(el.className, "on", "attached callback has been fired properly");

  el.className = "off";
  off(el, "click", classCb);
  trigger(el, "click");
  t.equal(el.className, "off", "triggered event didn't fire detached callback");

  t.end();
});

tape("test events on/off/trigger for multiple elements, one event", function(
  t
) {
  el.className = "";
  el2.className = "";

  on(els, "click", classCb);
  trigger(els, "click");
  t.equal(
    el.className,
    "on",
    "attached callback has been fired properly on the first element"
  );
  t.equal(
    el2.className,
    "on",
    "attached callback has been fired properly on the second element"
  );

  el.className = "off";
  el2.className = "off";
  off(els, "click", classCb);
  trigger(els, "click");
  t.equal(
    el.className,
    "off",
    "triggered event didn't fire detached callback on the first element"
  );
  t.equal(
    el2.className,
    "off",
    "triggered event didn't fire detached callback on the second element"
  );

  t.end();
});

tape("test events on/off/trigger for one element, multiple events", function(
  t
) {
  el.className = "";
  on(el, "click mouseover", classCb);
  trigger(el, "click mouseover");
  t.equal(el.className, "onon", "attached callbacks have been fired properly");

  el.className = "off";
  off(el, "click mouseover", classCb);
  trigger(el, "click mouseover");
  t.equal(
    el.className,
    "off",
    "triggered events didn't fire detached callback"
  );

  t.end();
});

tape(
  "test events on/off/trigger for multiple elements, multiple events",
  function(t) {
    el.className = "";
    el2.className = "";
    el.setAttribute("data-state", "");
    el2.setAttribute("data-state", "");
    on(els, "click mouseover", classCb);
    on(els, "resize scroll", attrCb);
    trigger(els, "click mouseover resize scroll");
    t.equal(
      el.className,
      "onon",
      "attached callbacks has been fired properly on the first element"
    );
    t.equal(
      el.getAttribute("data-state"),
      "ONON",
      "attached callbacks has been fired properly on the first element"
    );
    t.equal(
      el2.className,
      "onon",
      "attached callbacks has been fired properly on the second element"
    );
    t.equal(
      el2.getAttribute("data-state"),
      "ONON",
      "attached callbacks has been fired properly on the second element"
    );

    el.className = "off";
    el2.className = "off";
    el.setAttribute("data-state", "off");
    el2.setAttribute("data-state", "off");
    off(els, "click mouseover", classCb);
    off(els, "resize scroll", attrCb);
    trigger(els, "click mouseover resize scroll");
    t.equal(
      el.className,
      "off",
      "triggered events didn't fire detached callbacks on the first element"
    );
    t.equal(
      el.getAttribute("data-state"),
      "off",
      "triggered events didn't fire detached callbacks on the first element"
    );
    t.equal(
      el2.className,
      "off",
      "triggered events didn't fire detached callbacks on the first element"
    );
    t.equal(
      el2.getAttribute("data-state"),
      "off",
      "triggered events didn't fire detached callbacks on the first element"
    );

    t.end();
  }
);

tape("test events on top level elements", function(t) {
  var el = document;

  el.className = "";
  on(el, "click", classCb);
  trigger(el, "click");
  t.equal(
    el.className,
    "on",
    "attached callback has been fired properly on document"
  );

  el = window;

  el.className = "";
  // With jsdom, the default this is global, not window, so we need to explicitly bind to window.
  on(el, "click", classCb.bind(window));
  trigger(el, "click");
  t.equal(
    el.className,
    "on",
    "attached callback has been fired properly on window"
  );

  t.end();
});
