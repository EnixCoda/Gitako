var tape = require("tape");

var handleResponse = require("../../../lib/proto/handle-response");
var noop = require("../../../lib/util/noop");
var loadContent = require("../../../index").prototype.loadContent;

var href = "https://example.org/";

var storeEventHandler;
var pjaxErrorEventTriggerTest;

tape("test events triggered when handleResponse(false) is called", function(t) {
  t.plan(3);

  var pjax = {
    options: {
      test: 1
    }
  };

  var events = [];

  storeEventHandler = function(e) {
    events.push(e.type);

    t.equal(e.test, 1);
  };

  document.addEventListener("pjax:complete", storeEventHandler);
  document.addEventListener("pjax:error", storeEventHandler);

  handleResponse.bind(pjax)(false, null);

  t.same(
    events,
    ["pjax:complete", "pjax:error"],
    "calling handleResponse(false) triggers 'pjax:complete' and 'pjax:error'"
  );

  document.removeEventListener("pjax:complete", storeEventHandler);
  document.removeEventListener("pjax:error", storeEventHandler);

  t.end();
});

tape("test when handleResponse() is called normally", function(t) {
  var pjax = {
    options: {
      test: 1
    },
    loadContent: noop,
    state: {}
  };

  var request = {
    getResponseHeader: noop
  };

  handleResponse.bind(pjax)("", request, "href");

  delete window.history.state.uid;
  t.same(
    window.history.state,
    {
      url: href,
      title: "",
      scrollPos: [0, 0]
    },
    "window.history.state is set correctly"
  );
  t.equals(pjax.state.href, "href", "this.state.href is set correctly");
  t.equals(
    Object.keys(pjax.state.options).length,
    2,
    "this.state.options is set correctly"
  );
  t.same(
    pjax.state.options.request,
    request,
    "this.state.options is set correctly"
  );
  t.equals(pjax.state.options.test, 1, "this.state.options is set correctly");

  t.end();
});

tape(
  "test when handleResponse() is called normally with request.responseURL",
  function(t) {
    var pjax = {
      options: {},
      loadContent: noop,
      state: {}
    };

    var request = {
      responseURL: href + "1",
      getResponseHeader: noop
    };

    handleResponse.bind(pjax)("", request, "");

    t.equals(
      pjax.state.href,
      request.responseURL,
      "this.state.href is set correctly"
    );

    t.end();
  }
);

tape("test when handleResponse() is called normally with X-PJAX-URL", function(
  t
) {
  var pjax = {
    options: {},
    loadContent: noop,
    state: {}
  };

  var request = {
    getResponseHeader: function(header) {
      if (header === "X-PJAX-URL") {
        return href + "2";
      }
    }
  };

  handleResponse.bind(pjax)("", request, "");

  t.equals(pjax.state.href, href + "2", "this.state.href is set correctly");

  t.end();
});

tape(
  "test when handleResponse() is called normally with X-XHR-Redirected-To",
  function(t) {
    var pjax = {
      options: {},
      loadContent: noop,
      state: {}
    };

    var request = {
      getResponseHeader: function(header) {
        if (header === "X-XHR-Redirected-To") {
          return href + "3";
        }
      }
    };

    handleResponse.bind(pjax)("", request, "");

    t.equals(pjax.state.href, href + "3", "this.state.href is set correctly");

    t.end();
  }
);

tape("test when handleResponse() is called normally with a hash", function(t) {
  var pjax = {
    options: {},
    loadContent: noop,
    state: {}
  };

  var request = {
    responseURL: href + "2",
    getResponseHeader: noop
  };

  handleResponse.bind(pjax)("", request, href + "1#test");

  t.equals(
    pjax.state.href,
    href + "2#test",
    "this.state.href is set correctly"
  );

  t.end();
});

tape("test try...catch for loadContent() when options.debug is true", function(
  t
) {
  t.plan(2);

  var pjax = {
    options: {},
    loadContent: noop,
    state: {}
  };

  var request = {
    getResponseHeader: noop
  };

  pjax.loadContent = function() {
    throw new Error();
  };
  pjax.options.debug = true;

  document.removeEventListener("pjax:error", storeEventHandler);
  pjaxErrorEventTriggerTest = function() {
    t.pass("pjax:error event triggered");
  };
  document.addEventListener("pjax:error", pjaxErrorEventTriggerTest);

  t.throws(
    function() {
      handleResponse.bind(pjax)("", request, "");
    },
    Error,
    "error is rethrown"
  );

  t.end();
});

tape("test try...catch for loadContent()", function(t) {
  t.plan(2);

  var pjax = {
    options: {},
    loadContent: noop,
    state: {}
  };

  var request = {
    getResponseHeader: noop
  };

  pjax.loadContent = function() {
    throw new Error();
  };
  pjax.latestChance = function() {
    return true;
  };
  pjax.options.debug = false;

  document.removeEventListener("pjax:error", pjaxErrorEventTriggerTest);

  t.doesNotThrow(
    function() {
      t.equals(
        handleResponse.bind(pjax)("", request, ""),
        true,
        "this.latestChance() is called"
      );
    },
    Error,
    "error is not thrown"
  );

  t.end();
});

tape(
  "test events triggered when loadContent() is called with a non-string html argument",
  function(t) {
    t.plan(3);

    var options = {
      test: 1
    };

    var events = [];

    storeEventHandler = function(e) {
      events.push(e.type);

      t.equal(e.test, 1);
    };

    document.addEventListener("pjax:complete", storeEventHandler);
    document.addEventListener("pjax:error", storeEventHandler);

    loadContent(null, options);

    t.same(
      events,
      ["pjax:complete", "pjax:error"],
      "calling loadContent() with a non-string html argument triggers 'pjax:complete' and 'pjax:error'"
    );

    document.removeEventListener("pjax:complete", storeEventHandler);
    document.removeEventListener("pjax:error", storeEventHandler);

    t.end();
  }
);
