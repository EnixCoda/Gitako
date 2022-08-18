export const sanitizedLocation = {
  get href() {
    const { href, pathname } = window.location
    const hasDupSlashes = pathname.includes('//')
    const needSanitize = hasDupSlashes
    if (!needSanitize) return href

    const url = new URL(href)
    url.pathname = sanitizedLocation.pathname
    return url.href
  },
  get pathname() {
    const { pathname } = window.location
    // remove duplicated slashes
    return pathname.replace(/^\/\/+/g, '/')
  },
}
