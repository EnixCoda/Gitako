const browser = window.browser || {
  storage: {
    local: localStorage,
  },
  runtime: {
    getURL(path) {
      return path
    },
  },
}

window.browser = browser
