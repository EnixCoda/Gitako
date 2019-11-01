var jsdomOptions = {
  url: "https://example.org/",
  runScripts: "dangerously"
};

require("jsdom-global")("", jsdomOptions);
