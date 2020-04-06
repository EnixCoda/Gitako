# Pjax

[![Build Status](https://img.shields.io/travis/MoOx/pjax.svg)](https://travis-ci.org/MoOx/pjax).

> Easily enable fast AJAX navigation on any website (using pushState() + XHR)

Pjax is **a standalone JavaScript module** that uses
AJAX (XmlHttpRequest) and
[pushState()](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history)
to deliver a fast browsing experience.

_It allows you to completely transform the user experience of standard websites
(server-side generated or static ones) to make them feel like they are browsing an app,
especially for users with low bandwidth connection._

**No more full page reloads. No more multiple HTTP requests.**

_Pjax does not rely on other libraries, like jQuery or similar. It is written entirely in vanilla JS._

## Installation

- You can install Pjax from **npm**:
  ```shell
  npm install pjax
  ```

- You can also link directly to the [bundle](https://cdn.jsdelivr.net/npm/pjax/pjax.js):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/pjax@VERSION/pjax.js"></script>
  ```
  Or the [minified bundle](https://cdn.jsdelivr.net/npm/pjax/pjax.min.js):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/pjax@VERSION/pjax.min.js"></script>
  ```

## How Pjax works

Pjax loads pages using AJAX and updates the browser's current URL using `pushState()` without reloading your page's layout or any resources (JS, CSS), giving a fast page load.

_But under the hood, it's just ONE HTTP request with a `pushState()` call._

Obviously, for [browsers that don't support `history.pushState()`](http://caniuse.com/#search=pushstate) Pjax gracefully degrades and does not do anything at all.

It simply works with all permalinks and can update all parts of the page you
want (including HTML metas, title, and navigation state).

- It's not limited to one container, like jQuery-Pjax is.
- It fully supports browser history (back and forward buttons).
- It supports keyboard browsing.
- Automatically falls back to standard navigation for external pages (thanks to Captain Obvious's help).
- Automatically falls back to standard navigation for internal pages that do not have an appropriate DOM tree.
- You can add pretty cool CSS transitions (animations) very easily.
- It's around 4kb (minified and gzipped).

### Under the hood

- It listens to every click on links _you want_ (by default all of them).
- When an internal link is clicked, Pjax grabs HTML from your server via AJAX.
- Pjax renders the page's DOM tree (without loading any resources - images, CSS, JS...).
- It checks that all defined parts can be replaced:
  - If the page doesn't meet the requirements, standard navigation is used.
  - If the page meets the requirements, Pjax does all defined DOM replacements.
- Then it updates the browser's current URL using `pushState()`.

## Overview

Pjax is fully automatic. You don't need to setup anything in the existing HTML.
You just need to designate some elements on your page that will be replaced when
you navigate your site.

Consider the following page.

```html
<!DOCTYPE html>
<html>
<head>
  <!-- metas, title, styles, ... -->
</head>
<body>
  <header class="my-Header"><nav><!-- a .is-active is in there --></nav></header>
  <section class="my-Content">
    Sha blah <a href="/blah ">blah</a>.
  </section>
  <aside class="my-Sidebar">Sidebar stuff</aside>
  <footer class="my-Footer"></footer>
  <script src="onDomReadystuff.js"></script>
  <script><!-- analytics --></script>
</body>
</html>
```

We want Pjax to intercept the URL `/blah`, and replace `.my-Content` with the results of the request.
Oh and the `<nav>` (that contains a status marker somewhere) can be updated too (or stay the same, as you wish).
And also the `<aside>` please.
So we want to update `[".my-Header", ".my-Content", ".my-Sidebar"]`, **without reloading styles nor scripts**.

We do this by telling Pjax to listen on `a` tags and use CSS selectors defined above (without forgetting minimal meta):

``` javascript
var pjax = new Pjax({ selectors: ["title", ".my-Header", ".my-Content", ".my-Sidebar"] })
```

Now, when someone in a Pjax-compatible browser clicks "blah", the content of all selectors will be replaced with the one found in the "blah" content.

_Magic! For real!_ **There is no need to do anything server-side!**

## Differences with [jQuery-pjax](https://github.com/defunkt/jquery-pjax)

- No jQuery dependency
- Not limited to a container
- No server-side requirements
- Works for CommonJS environment (Webpack/Browserify), AMD (RequireJS) or even globally
- Allow page transition with CSS animations
- Can be easily tweaked, since every method is public (and as a result, overridable)

## Compatibility

Pjax only works with [browsers that support the `history.pushState()` API](http://caniuse.com/#search=pushstate).
When the API isn't supported, Pjax goes into fallback mode (and it just does nothing).

To see if Pjax is actually supported by your browser, use `Pjax.isSupported()`.

## Usage

### Methods

#### `new Pjax()`

Let's talk more about the most basic way to get started.

When instantiating `Pjax`, you can pass options in to the constructor as an object:

```js
var pjax = new Pjax({
  elements: "a", // default is "a[href], form[action]"
  selectors: ["title", ".my-Header", ".my-Content", ".my-Sidebar"]
})
```

This will enable Pjax on all links, and designate the part to replace using CSS selectors `"title", ".my-Header", ".my-Content", ".my-Sidebar"`.

For some reason, you might want to just target some elements to apply Pjax behavior.
In that case, you can do two different things:

- Use a custom selector like "a.js-Pjax" or ".js-Pjax a" depending on what you want.
- Override `Pjax.prototype.getElements` that just basically `querySelectorAll` the `elements` option. In this function you just need to return a `NodeList`.

```js
// use case 1
var pjax = new Pjax({ elements: "a.js-Pjax" })


// use case 2
Pjax.prototype.getElements = function() {
  return document.getElementsByClassName(".js-Pjax")
}

var pjax = new Pjax()
```

#### `loadUrl(href, [options])`

With this method, you can manually trigger loading of a URL:

```js
var pjax = new Pjax()

// use case 1 (without options override)
pjax.loadUrl("/your-url")

// use case 2 (with options override)
pjax.loadUrl("/your-other-url", {timeout: 10})
```

#### `handleResponse(responseText, request, href)`

This method takes the raw response, processes the URL, then calls `pjax.loadContent()` to actually load it into the DOM.

It is passed the following arguments:

* **responseText** (string): This is the raw response text. This is equivalent to `request.responseText`.
* **request** (XMLHttpRequest): This is the XHR object.
* **href** (string): This is the URL that was passed to `loadUrl()`.

You can override this if you want to process the data before, or instead of, it being loaded into the DOM.

For example, if you want to check for a JSON response, you could do the following:

```js
var pjax = new Pjax();

pjax._handleResponse = pjax.handleResponse;

pjax.handleResponse = function(responseText, request, href) {
  if (request.responseText.match("<html")) {
    pjax._handleResponse(responseText, request, href);
  } else {
    // handle response here
  }
}
```


#### `refresh([el])`

Use this method to bind Pjax to children of a DOM element that didn't exist when Pjax was initialised e.g. content inserted dynamically by another library or script. If called with no arguments, Pjax will parse the entire document again to look for newly-inserted elements.

```js
// Inside a callback or Promise that runs after new DOM content has been inserted
var newContent = document.querySelector(".new-content");

pjax.refresh(newContent);
```


#### `reload()`

A helper shortcut for `window.location.reload()`. Used to force a page reload.


### Options

##### `elements` (String, default: `"a[href], form[action]"`)

CSS selector to use to retrieve links to apply Pjax to.

##### `selectors` (Array, default: `["title", ".js-Pjax"]`)

CSS selectors to replace. If a query returns multiples items, it will just keep the index.

Example of what you can do:

```html
<!doctype html>
<html>
<head>
  <title>Page title</title>
</head>
<body>
  <header class="js-Pjax"></header>
  <section class="js-Pjax">...</section>
  <footer class="my-Footer"></footer>
  <script>...</script>
</body>
</html>
```

This example is correct and should work "as expected".
_If the current page and new page do not have the same amount of DOM elements,
Pjax will fall back to normal page load._

##### `switches` (Object, default: `{}`)

Objects containing callbacks that can be used to switch old elements with new elements.
Keys should be one of the defined selectors.

Examples:

```js
var pjax = new Pjax({
  selectors: ["title", ".Navbar", ".js-Pjax"],
  switches: {
    // "title": Pjax.switches.outerHTML // default behavior
    ".Navbar": function(oldEl, newEl, options) {
      // here it's a stupid example since it's the default behavior too
      oldEl.outerHTML = newEl.outerHTML
      this.onSwitch()
    },

    ".js-Pjax": Pjax.switches.sideBySide
  }
})
```

Callbacks are bound to Pjax instance itself to allow you to reuse it (ex: `this.onSwitch()`)

###### Existing switches callback

- `Pjax.switches.outerHTML`: default behavior, replace elements using outerHTML
- `Pjax.switches.innerHTML`: replace elements using innerHTML and copy className too
- `Pjax.switches.replaceNode`: replace elements using replaceChild
- `Pjax.switches.sideBySide`: smart replacement that allows you to have both elements in the same parent when you want to use CSS animations. Old elements are removed when all children have been fully animated ([animationEnd](http://www.w3.org/TR/css3-animations/#animationend) event triggered)

###### Create a switch callback

Your function can do whatever you want, but you need to:

- replace `oldEl`'s content with `newEl`'s content in some fashion
- call `this.onSwitch()` to trigger the attached callback.

Here is the default behavior as an example:

```js
function(oldEl, newEl, pjaxRequestOptions, switchesClasses) {
  oldEl.outerHTML = newEl.outerHTML
  this.onSwitch()
}
```

##### `switchesOptions` (Object, default: `{}`)

These are options that can be used during switch by switchers (for now, only `Pjax.switches.sideBySide` uses it).
This is very convenient when you use something like [Animate.css](https://github.com/daneden/animate.css)
with or without [WOW.js](https://github.com/matthieua/WOW).

```js
var pjax = new Pjax({
  selectors: ["title", ".js-Pjax"],
  switches: {
    ".js-Pjax": Pjax.switches.sideBySide
  },
  switchesOptions: {
    ".js-Pjax": {
      classNames: {
        // class added on the element that will be removed
        remove: "Animated Animated--reverse Animate--fast Animate--noDelay",
        // class added on the element that will be added
        add: "Animated",
        // class added on the element when it go backward
        backward: "Animate--slideInRight",
        // class added on the element when it go forward (used for new page too)
        forward: "Animate--slideInLeft"
      },
      callbacks: {
        // to make a nice transition with 2 pages as the same time
        // we are playing with absolute positioning for element we are removing
        // & we need live metrics to have something great
        // see associated CSS below
        removeElement: function(el) {
          el.style.marginLeft = "-" + (el.getBoundingClientRect().width/2) + "px"
        }
      }
    }
  }
})
```
_Note that remove class include `Animated--reverse` which is a simple way to not have
to create duplicate transition for (slideIn + reverse => slideOut)._

The following CSS will be required to make something nice:

```css
/*
  if your content elements doesn't have a fixed width,
  you can get issue when absolute positioning will be used
  so you will need that rules
*/
.js-Pjax { position: relative } /* parent element where switch will be made */

  .js-Pjax-child { width: 100% }

  /* position for the elements that will be removed */
  .js-Pjax-remove {
    position: absolute;
    left: 50%;
    /* transform: translateX(-50%) */
    /* transform can't be used since we already use generic translate for the remove effect (eg animate.css) */
    /* margin-left: -width/2; // made with js */
    /* you can totally drop the margin-left thing from switchesOptions if you use custom animations */
  }

/* CSS animations */
.Animated {
  animation-fill-mode: both;
  animation-duration: 1s;
}

  .Animated--reverse { animation-direction: reverse }

  .Animate--fast { animation-duration: .5s }
  .Animate--noDelay { animation-delay: 0s !important;  }

  .Animate--slideInRight { animation-name: Animation-slideInRight }
  @keyframes Animation-slideInRight {
    0% {
      opacity: 0;
      transform: translateX(100rem);
    }

    100% {
      transform: translateX(0);
    }
  }

  .Animate--slideInLeft { animation-name: Animation-slideInLeft }
  @keyframes Animation-slideInLeft {
    0% {
      opacity: 0;
      transform: translateX(-100rem);
    }

    100% {
      transform: translateX(0);
    }
  }
```

To give context to this CSS, here is an HTML snippet:

```html
<!doctype html>
<html>
<head>
  <title>Page title</title>
</head>
<body>
  <section class="js-Pjax">
    <div class="js-Pjax-child">
      Your content here
    </div>
    <!--
    when switching will be made you will have the following tree
    <div class="js-Pjax-child js-Pjax-remove Animate...">
      Your OLD content here
    </div>
    <div class="js-Pjax-child js-Pjax-add Animate...">
      Your NEW content here
    </div>
    -->
  </section>
  <script>...</script>
</body>
</html>
```

##### `history` (Boolean, default: `true`)

Enable the use of `pushState()`. Disabling this will prevent Pjax from updating browser history.
However, there is almost no use case where you would want to do that.

Internally, this option is used when a `popstate` event triggers Pjax (to not `pushState()` again).

##### `analytics` (Function | Boolean, default: a function that pushes `_gaq` `_trackPageview` or sends `ga` `pageview`

Function that allows you to add behavior for analytics. By default it tries to track
a pageview with Google Analytics (if it exists on the page).
It's called every time a page is switched, even for history navigation.

Set to `false` to disable this behavior.

##### `scrollTo` (Integer | \[Integer, Integer\] | False, default: `0`)

When set to an integer, this is the value (in px from the top of the page) to scroll to when a page is switched.

When set to an array of 2 integers (\[x, y\]), this is the value to scroll both horizontally and vertically.

Set this to `false` to disable scrolling, which will mean the page will stay in that same position it was before loading the new elements.

##### `scrollRestoration` (Boolean, default: `true`)

When set to true, attempt to restore the scroll position when navigating backwards or forwards.

##### `cacheBust` (Boolean, default: `true`)

When set to true, append a timestamp query string segment to the requested URLs
in order to skip browser cache.

##### `debug` (Boolean, default: `false`)

Enables verbose mode. Useful to debug page layout differences.

##### `currentUrlFullReload` (Boolean, default: `false`)

When set to true, clicking on a link that points to the current URL will trigger a full page reload.

When set to `false`, clicking on such a link will cause Pjax to load the 
current page like any page.
If you want to add some custom behavior, add a click listener to the link,
and set `preventDefault` to true, to prevent Pjax from receiving the event.

Note: this must be done before Pjax is instantiated. Otherwise, Pjax's 
event handler will be called first, and preventDefault() won't be called yet.

Here is some sample code:

```js
  var links = document.querySelectorAll(".js-Pjax");

  for (var i = 0; i < links.length; i++) {
    var el = links[i]

    el.addEventListener("click", function(e) {
      if (el.href === window.location.href.split("#")[0]) {
        e.preventDefault();
        console.log("Link to current page clicked");
        // Custom code goes here.
      }
    })
  }
  
  var pjax = new Pjax()
```

(Note that if `cacheBust` is set to true, the code that checks if the href
is the same as the current page's URL will not work, due to the query string
appended to force a cache bust).

##### `timeout` (Integer, default: `0`)

The timeout in milliseconds for the XHR requests. Set to 0 to disable the timeout.

### Events

Pjax fires a number of events regardless of how it's invoked.

All events are fired from the _document_, not the link that was clicked.

* `pjax:send` - Fired after the Pjax request begins.
* `pjax:complete` - Fired after the Pjax request finishes.
* `pjax:success` - Fired after the Pjax request succeeds.
* `pjax:error` - Fired after the Pjax request fails. The request object will be passed along as `event.options.request`.

`send` and `complete` are a good pair of events to use if you are implementing a loading indicator (eg: [topbar](http://buunguyen.github.io/topbar/))

```js
document.addEventListener('pjax:send', topbar.show)
document.addEventListener('pjax:complete', topbar.hide)
```

### HTTP Headers

Pjax uses several custom headers when it makes and receives HTTP requests. 
If the requests are going to your server, you can use those headers for
some meta information about the response.

##### Request headers

Pjax sends the following headers with every request:

* `X-Requested-With: "XMLHttpRequest"`
* `X-PJAX: "true"`
* `X-PJAX-Selectors`: A serialized JSON array of selectors, taken from 
`options.selectors`. You can use this to send back only the elements that 
Pjax will use to switch, instead of sending the whole page. Use `JSON.parse()` 
server-side to deserialize it back to an array.

##### Response headers

Pjax looks for the following headers on the response:

* `X-PJAX-URL` or `X-XHR-Redirected-To`

  Pjax first checks the `responseURL` property on the XHR object to 
  check if the request was redirected by the server. Most browsers support 
  this, but not all. To ensure Pjax will be able to tell when the request 
  is redirected, you can include one of these headers with the response, 
  set to the final URL.


#### Note about DOM ready state

Most of the time, you will have code related to the current DOM that you only execute when the DOM is ready.

Since Pjax doesn't magically re-execute your previous code each time you load a page, you need to add some simple code to achieve this:

```js
function whenDOMReady() {
  // do your stuff
}

whenDOMReady()

var pjax = new Pjax()

document.addEventListener("pjax:success", whenDOMReady)
```

_Note: Don't create the Pjax instance in the `whenDOMReady` function._

For my concern and usage, I `js-Pjax`-ify all body children, including stuff like navigation and footer (to get navigation state easily updated).

The attached behavior is re-executed each time a page is loaded, like in the snippet above.

If you want to just update a specific part (it's totally a good idea), you can just
add the DOM-related code in a function and re-execute this function when "pjax:success" event is fired.

```js
// do your global stuff
//... DOM ready blah blah

function whenContainerReady() {
  // do your container related stuff
}
whenContainerReady()

var pjax = new Pjax()

document.addEventListener("pjax:success", whenContainerReady)
```

---

## FAQ

### Q: Disqus doesn't work anymore, how can I fix that ?

A: There is a few things you need to do:
- wrap your Disqus snippet into a DOM element that you will add to the `selector`
property (or just wrap it with `class="js-Pjax"`) and be sure to have at least the empty
wrapper on each page (to avoid differences of DOM between pages)
- edit your Disqus snippet like the one below

#### Disqus snippet before Pjax integration

```html
<script>
  var disqus_shortname = 'YOURSHORTNAME'
  var disqus_identifier = 'PAGEID'
  var disqus_url = 'PAGEURL'
  var disqus_script = 'embed.js'
  (function(d,s) {
  s = d.createElement('script');s.async=1;s.src = '//' + disqus_shortname + '.disqus.com/'+disqus_script;
  (d.getElementsByTagName('head')[0]).appendChild(s);
  })(document)
</script>
```

#### Disqus snippet after Pjax integration

```html
<div class="js-Pjax"><!-- needs to be here on every Pjax-ified page, even if empty -->
<!-- if (blah blah) { // eventual server-side test to know whether or not you include this script -->
  <script>
    var disqus_shortname = 'YOURSHORTNAME'
    var disqus_identifier = 'PAGEID'
    var disqus_url = 'PAGEURL'
    var disqus_script = 'embed.js'

    // here we will only load the disqus <script> if not already loaded
    if (!window.DISQUS) {
      (function(d,s) {
      s = d.createElement('script');s.async=1;s.src = '//' + disqus_shortname + '.disqus.com/'+disqus_script;
      (d.getElementsByTagName('head')[0]).appendChild(s);
      })(document)
    }
    // if disqus <script> already loaded, we just reset disqus the right way
    // see http://help.disqus.com/customer/portal/articles/472107-using-disqus-on-ajax-sites
    else {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = disqus_identifier
          this.page.url = disqus_url
        }
      })
    }
  </script>
<!-- } -->
</div>
```

**Note: Pjax only handles inline `<script>` blocks for the container you are switching.**

---

## Examples

Clone this repository and run `npm run example`, which will open the example app in your browser.

---

## CONTRIBUTING

* ⇄ Pull requests and ★ Stars are always welcome.
* For bugs and feature requests, please create an issue.
* Pull requests must be accompanied by passing automated tests (`npm test`). If the API is changed, please update the Typescript definitions as well (`pjax.d.ts`).

## [CHANGELOG](CHANGELOG.md)

## [LICENSE](LICENSE)
