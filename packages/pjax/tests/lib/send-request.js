var tape = require("tape");

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

tape("test xhr request", function(t) {
  var url = "https://httpbin.org/get";

  t.test("- request is made, gets a result, and is cache-busted", function(t) {
    var r = sendRequest(url, { cacheBust: true }, function(result) {
      t.equal(
        r.responseURL.indexOf("?"),
        url.length,
        "XHR URL is cache-busted when configured to be"
      );
      try {
        result = JSON.parse(result);
      } catch (e) {
        t.fail("xhr doesn't get a JSON response");
      }
      t.same(typeof result, "object", "xhr request get a result");
      t.end();
    });
  });
  t.test("- request is not cache-busted when configured not to be", function(
    t
  ) {
    var r = sendRequest(url, {}, function() {
      t.equal(r.responseURL, url, "XHR URL is left untouched");
      t.end();
    });
  });
  t.end();
});

tape("request headers are sent properly", function(t) {
  var url = "https://httpbin.org/headers";
  var options = {
    selectors: ["div.pjax", "div.container"]
  };

  sendRequest(url, options, function(responseText) {
    var headers = JSON.parse(responseText).headers;

    t.equals(
      headers["X-Requested-With"],
      "XMLHttpRequest",
      "X-Requested-With header is set correctly"
    );
    // Httpbin.org changes the case to 'X-Pjax'
    t.equals(headers["X-Pjax"], "true", "X-PJAX header is set correctly");
    t.equals(
      headers["X-Pjax-Selectors"],
      '["div.pjax","div.container"]',
      "X-PJAX-Selectors header is set correctly"
    );

    t.end();
  });
});

tape("HTTP status codes other than 200 are handled properly", function(t) {
  var url = "https://httpbin.org/status/400";

  sendRequest(url, {}, function(responseText, request) {
    t.equals(responseText, null, "responseText is null");
    t.equals(request.status, 400, "HTTP status code is correct");

    t.end();
  });
});

tape.skip("XHR error is handled properly", function(t) {
  var url = "https://encrypted.google.com/foobar";

  sendRequest(url, {}, function(responseText) {
    t.equals(responseText, null, "responseText is null");

    t.end();
  });
});

tape("POST body data is sent properly", function(t) {
  var url = "https://httpbin.org/post";
  var params = [
    {
      name: "test",
      value: "1"
    }
  ];
  var options = {
    requestOptions: {
      requestMethod: "POST",
      requestParams: params
    }
  };

  sendRequest(url, options, function(responseText) {
    var response = JSON.parse(responseText);

    t.same(
      response.form[params[0].name],
      params[0].value,
      "requestParams were sent properly"
    );
    t.equals(
      response.headers["Content-Type"],
      "application/x-www-form-urlencoded",
      "Content-Type header was set properly"
    );

    t.end();
  });
});

tape("GET query data is sent properly", function(t) {
  var url = "https://httpbin.org/get";
  var params = [
    {
      name: "test",
      value: "1"
    }
  ];
  var options = {
    requestOptions: {
      requestParams: params
    }
  };

  sendRequest(url, options, function(responseText) {
    var response = JSON.parse(responseText);

    t.same(
      response.args[params[0].name],
      params[0].value,
      "requestParams were sent properly"
    );

    t.end();
  });
});

tape("XHR timeout is handled properly", function(t) {
  var url = "https://httpbin.org/delay/5";
  var options = {
    timeout: 1000
  };

  sendRequest(url, options, function(responseText) {
    t.equals(responseText, null, "responseText is null");

    t.end();
  });
});
