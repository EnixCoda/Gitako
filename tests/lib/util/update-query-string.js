var tape = require("tape");

var updateQueryString = require("../../../lib/util/update-query-string");

tape("test update query string method", function(t) {
  var url = "http://example.com";
  var updatedUrl = updateQueryString(url, "foo", "bar");

  t.notEqual(url, updatedUrl, "update query string modifies URL");
  t.equal(
    updatedUrl,
    url + "?foo=bar",
    "update query string creates new query string when no query string params are set"
  );

  updatedUrl = updateQueryString(updatedUrl, "foo", "baz");

  t.equal(
    updatedUrl,
    url + "?foo=baz",
    "update query string updates existing query string param"
  );

  updatedUrl = updateQueryString(updatedUrl, "bar", "");

  t.equal(
    updatedUrl,
    url + "?foo=baz&bar=",
    "update query string appends to existing query string"
  );

  t.end();
});
