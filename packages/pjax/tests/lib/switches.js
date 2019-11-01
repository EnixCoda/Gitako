var tape = require("tape");
var switches = require("../../lib/switches");
var noop = require("../../lib/util/noop");

tape("test outerHTML switch", function(t) {
  var outerHTML = switches.outerHTML;

  var doc = document.implementation.createHTMLDocument();

  var container = doc.createElement("div");
  container.innerHTML = "<p id='p'>Original Text</p>";
  doc.body.appendChild(container);

  var p = doc.createElement("p");
  p.innerHTML = "New Text";

  outerHTML.bind({
    onSwitch: noop
  })(doc.querySelector("p"), p);

  t.equals(
    doc.querySelector("p").innerHTML,
    "New Text",
    "Elements correctly switched"
  );
  t.notEquals(
    doc.querySelector("p").id,
    "p",
    "other attributes overwritten correctly"
  );

  t.end();
});

tape("test innerHTML switch", function(t) {
  var innerHTML = switches.innerHTML;

  var doc = document.implementation.createHTMLDocument();

  var container = doc.createElement("div");
  container.innerHTML = "<p id='p'>Original Text</p>";
  doc.body.appendChild(container);

  var p = doc.createElement("p");
  p.innerHTML = "New Text";
  p.className = "p";

  innerHTML.bind({
    onSwitch: noop
  })(doc.querySelector("p"), p);

  t.equals(
    doc.querySelector("p").innerHTML,
    "New Text",
    "Elements correctly switched"
  );
  t.equals(doc.querySelector("p").className, "p", "classname set correctly");
  t.equals(doc.querySelector("p").id, "p", "other attributes set correctly");

  p.removeAttribute("class");

  innerHTML.bind({
    onSwitch: noop
  })(doc.querySelector("p"), p);

  t.equals(doc.querySelector("p").className, "", "classname set correctly");

  t.end();
});

tape("test replaceNode switch", function(t) {
  var replaceNode = switches.replaceNode;

  var doc = document.implementation.createHTMLDocument();

  var container = doc.createElement("div");
  container.innerHTML = "<p>Original Text</p>";
  doc.body.appendChild(container);

  var p = doc.createElement("p");
  p.innerHTML = "New Text";

  replaceNode.bind({
    onSwitch: noop
  })(doc.querySelector("p"), p);

  t.equals(
    doc.querySelector("div").innerHTML,
    "<p>New Text</p>",
    "Elements correctly switched"
  );

  t.end();
});
