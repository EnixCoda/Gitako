var tape = require("tape");

var on = require("../../../lib/events/on");
var trigger = require("../../../lib/events/trigger");
var attachForm = require("../../../lib/proto/attach-form");

var attr = "data-pjax-state";

tape("test attach form prototype method", function(t) {
  var form = document.createElement("form");
  var loadUrlCalled = false;

  attachForm.call(
    {
      options: {
        currentUrlFullReload: true
      },
      loadUrl: function() {
        loadUrlCalled = true;
      }
    },
    form
  );

  var internalUri =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    window.location.search;

  form.action = "http://external.com/";
  trigger(form, "submit");
  t.equal(form.getAttribute(attr), "external", "external url stop behavior");

  form.action = internalUri + "#anchor";
  trigger(form, "submit");
  t.equal(form.getAttribute(attr), "anchor", "internal anchor stop behavior");

  window.location.hash = "#anchor";
  form.action = internalUri + "#another-anchor";
  trigger(form, "submit");
  t.equal(form.getAttribute(attr), "anchor", "different anchors stop behavior");
  window.location.hash = "";

  form.action = internalUri + "#";
  trigger(form, "submit");
  t.equal(
    form.getAttribute(attr),
    "anchor-empty",
    "empty anchor stop behavior"
  );

  form.action = window.location.href;
  trigger(form, "submit");
  t.equal(
    form.getAttribute(attr),
    "reload",
    "submitting when currentUrlFullReload is true will submit normally, without XHR"
  );
  t.equal(loadUrlCalled, false, "loadUrl() not called");

  form.action =
    window.location.protocol + "//" + window.location.host + "/internal";
  form.method = "POST";
  trigger(form, "submit");
  t.equal(
    form.getAttribute(attr),
    "submit",
    "triggering a POST request to the next page"
  );
  t.equal(loadUrlCalled, true, "loadUrl() called correctly");

  loadUrlCalled = false;
  form.setAttribute(attr, "");
  form.action =
    window.location.protocol + "//" + window.location.host + "/internal";
  form.method = "GET";
  trigger(form, "submit");
  t.equal(
    form.getAttribute(attr),
    "submit",
    "triggering a GET request to the next page"
  );
  t.equal(loadUrlCalled, true, "loadUrl() called correctly");

  t.end();
});

tape("test attach form preventDefaulted events", function(t) {
  var loadUrlCalled = false;
  var form = document.createElement("form");

  // This needs to be before the call to attachForm()
  on(form, "submit", function(event) {
    event.preventDefault();
  });

  attachForm.call(
    {
      options: {},
      loadUrl: function() {
        loadUrlCalled = true;
      }
    },
    form
  );

  form.action = "#";
  trigger(form, "submit");
  t.equal(
    loadUrlCalled,
    false,
    "events that are preventDefaulted should not fire callback"
  );

  t.end();
});

tape("test options are not modified by attachForm", function(t) {
  var form = document.createElement("form");
  var options = { foo: "bar" };
  var loadUrl = function() {};

  attachForm.call({ options: options, loadUrl: loadUrl }, form);

  form.action =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    window.location.search;
  form.method = "GET";
  trigger(form, "submit");

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

tape("test form elements parsed correctly", function(t) {
  t.plan(1);

  var form = document.createElement("form");
  var input = document.createElement("input");
  input.name = "input";
  input.value = "value";
  form.appendChild(input);

  var params = [
    {
      name: "input",
      value: "value"
    }
  ];
  var pjax = {
    options: {},
    loadUrl: function(href, options) {
      t.same(
        options.requestOptions.requestParams,
        params,
        "form elements parsed correctly"
      );
    }
  };

  attachForm.call(pjax, form);

  form.action =
    window.location.protocol + "//" + window.location.host + "/internal";

  trigger(form, "submit");
  // see loadUrl defined above

  t.end();
});

tape('test form.enctype="multipart/form-data"', function(t) {
  t.plan(4);

  var form = document.createElement("form");
  form.enctype = "multipart/form-data";
  var input = document.createElement("input");
  input.name = "input";
  input.value = "value";
  form.appendChild(input);

  var pjax = {
    options: {},
    loadUrl: function(href, options) {
      t.equals(
        options.requestOptions.requestParams,
        undefined,
        "form elements not parsed manually"
      );
      t.true(
        options.requestOptions.formData instanceof FormData,
        "requestOptions.formData is a FormData"
      );
      t.equals(
        Array.from(options.requestOptions.formData.entries()).length,
        1,
        "correct number of FormData elements"
      );
      t.equals(
        options.requestOptions.formData.get("input"),
        "value",
        "FormData element value set correctly"
      );
    }
  };

  attachForm.call(pjax, form);

  form.action =
    window.location.protocol + "//" + window.location.host + "/internal";

  trigger(form, "submit");
  // see loadUrl defined above

  t.end();
});
