const localStorage = chrome.storage.local

function get(mapping: string | string[] | object): Promise<any> {
  return new Promise(resolve => localStorage.get(mapping, resolve))
}

function set(value: any): Promise<void> {
  // it's ok
  return new Promise(resolve => localStorage.set(value, resolve))
}

export default {
  get,
  set,
}
