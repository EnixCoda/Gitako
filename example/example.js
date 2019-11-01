/* global Pjax */
var pjax;
var initButtons = function() {
  var buttons = document.querySelectorAll("button[data-manual-trigger]");

  if (!buttons) {
    return;
  }

  // jshint -W083
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function(e) {
      var el = e.currentTarget;

      if (el.getAttribute("data-manual-trigger-override") === "true") {
        // Manually load URL with overridden Pjax instance options
        pjax.loadUrl("/example/page2.html", { cacheBust: false });
      } else {
        // Manually load URL with current Pjax instance options
        pjax.loadUrl("/example/page2.html");
      }
    });
  }
  // jshint +W083
};

console.log("Document initialized:", window.location.href);

document.addEventListener("pjax:send", function() {
  console.log("Event: pjax:send", arguments);
});

document.addEventListener("pjax:complete", function() {
  console.log("Event: pjax:complete", arguments);
});

document.addEventListener("pjax:error", function() {
  console.log("Event: pjax:error", arguments);
});

document.addEventListener("pjax:success", function() {
  console.log("Event: pjax:success", arguments);

  // Init page content
  initButtons();
});

document.addEventListener("DOMContentLoaded", function() {
  // Init Pjax instance
  pjax = new Pjax({
    elements: [".js-Pjax"],
    selectors: [".body", "title"],
    cacheBust: true
  });
  console.log("Pjax initialized.", pjax);

  // Init page content
  initButtons();
});
