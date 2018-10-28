const localStorage = chrome.storage.local

function get(mapping) {
  return new Promise(resolve => localStorage.get(mapping, resolve))
}

function set(value) {
  return new Promise(resolve => localStorage.set(value, resolve))
}

export default {
  get,
  set,
}
