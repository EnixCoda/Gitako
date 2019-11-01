import Pjax = require("../index");

let options: Pjax.IOptions = {
  elements: "a.pjax, form.pjax",
  selectors: ["div.pjax"],
  switches: {
    "a.pjax": (oldEl, newEl) => {
      oldEl.parentNode.replaceChild(newEl, oldEl);
      this.onSwitch();
    },
    "form.pjax": Pjax.switches.innerHTML
  },
  switchesOptions: {},
  history: true,
  analytics: false,
  scrollTo: 1,
  scrollRestoration: false,
  cacheBust: false,
  debug: true,
  timeout: 60000,
  currentUrlFullReload: true
};

options.analytics = () => {};
options.scrollTo = [1, 1];
options.scrollTo = false;

if (Pjax.isSupported()) {
  delete options.switchesOptions;
  const pjax = new Pjax(options);

  pjax.reload();
  pjax.loadUrl("https://example.org", options);

  pjax._handleResponse = pjax.handleResponse;
  pjax.handleResponse = (requestText: string, request: XMLHttpRequest, href: string) => {
    pjax.abortRequest(request);

    return pjax._handleResponse(requestText, request, href);
  }
}
