var tape = require("tape")

var evalScript = require("../../lib/eval-script")

tape("test evalScript method", function(t) {
  document.body.className = ""

  var script = document.createElement("script")
  script.innerHTML = "document.body.className = 'executed'"

  t.equal(document.body.className, "", "script hasn't been executed yet")

  evalScript(script)
  t.equal(document.body.className, "executed", "script has been properly executed")

  script.innerHTML = "document.write('failure')"
  var bodyText = "document.write hasn't been executed"
  document.body.text = bodyText
  evalScript(script)
  t.equal(document.body.text, bodyText, "document.write hasn't been executed")

  t.end()
})
