const localStorage = chrome.storage.local
const ACCESS_TOKEN_KEY = 'access_token'
const SHORTCUT_KEY = 'shortcut'

function get(key) {
  return new Promise(resolve => localStorage.get(key, items => resolve(items[key])))
}

function set(key, value) {
  return new Promise(resolve => localStorage.set({ [key]: value }, resolve))
}

function getAccessToken() {
  return get(ACCESS_TOKEN_KEY)
}

function setAccessToken(accessToken) {
  return set(ACCESS_TOKEN_KEY, accessToken)
}

function getShortcut() {
  return get(SHORTCUT_KEY)
}

function setShortcut(shortcut) {
  return set(SHORTCUT_KEY, shortcut)
}

export default {
  get,
  set,
  getAccessToken,
  setAccessToken,
  getShortcut,
  setShortcut,
}
