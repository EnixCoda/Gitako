const localStorage = chrome.storage.local

function get(mapping: string | string[] | object) {
  return new Promise(resolve => localStorage.get(mapping, resolve))
}

function set(value: any) {
  return new Promise(resolve => localStorage.set(value, resolve))
}

export default {
  get,
  set,
}
