var tape = require("tape");

var abortRequest = require("../../lib/abort-request.js");
var sendRequest = require("../../lib/send-request.js");

// Polyfill responseURL property into XMLHttpRequest if it doesn't exist,
// just for the purposes of this test
// This polyfill is not complete; it won't show the updated location if a
// redirection occurred, but it's fine for our purposes.
if (!("responseURL" in XMLHttpRequest.prototype)) {
  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.responseURL = url;
    return nativeOpen.apply(this, arguments);
  };
}

tape("test aborting xhr request", function(t) {
  var requestCacheBust = sendRequest.bind({
    options: {
      cacheBust: true
    }
  });

  t.test("- pending request is aborted", function(t) {
    var r = requestCacheBust("https://httpbin.org/delay/10", {}, function() {
      t.fail("xhr was not aborted");
    });
    t.equal(r.readyState, 1, "xhr readyState is '1' (SENT)");
    abortRequest(r);
    t.equal(r.readyState, 0, "xhr readyState is '0' (ABORTED)");
    t.equal(r.status, 0, "xhr HTTP status is '0' (ABORTED)");
    t.equal(r.responseText, "", "xhr response is empty");
    t.end();
  });
  t.test("- request is not aborted if it has already completed", function(t) {
    var r = requestCacheBust("https://httpbin.org/get", {}, function() {
      abortRequest(r);
      t.equal(r.readyState, 4, "xhr readyState is '4' (DONE)");
      t.equal(r.status, 200, "xhr HTTP status is '200' (OK)");
      t.end();
    });
  });
  t.test("- request is not aborted if it is undefined", function(t) {
    var r;
    try {
      abortRequest(r);
    } catch (e) {
      t.fail("aborting an undefined request threw an error");
    }
    t.equal(typeof r, "undefined", "undefined xhr was ignored");
    t.end();
  });
  t.end();
});
