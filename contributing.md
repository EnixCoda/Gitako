# Contributing

Thank you if you are trying to contribute!

Note: if you were using Windows, you may need to find alternatives for `make` commands. Or use WSL. I've not tested development on Windows and do not guarantee if it would work.

## Set up development env

1. Clone the repo
1. Run `make pull-icons` to install dependencies
1. Run `yarn` to install dependencies
1. Run `yarn dev` to start the development server, you'll see a `dist` folder appear in the root of this project
1. Open the extensions page in Chrome, enable developer mode, and load the extension from the `dist` folder
1. Navigate to repository of your choice and you should see the extension appear

When you modify source code, you need to do either of below to apply your changes:

- (recommended) use [the Extension Reloader extension](https://chrome.google.com/webstore/detail/fimgfedafeadlieiabdeeaodndnlbhid). It could reload all extensions then refresh the page (you need to enable it in its settings).
- manually reload the extension in the `chrome://extensions` and then refresh your repository page

## Develop with more browsers

Gitako supports more browsers, in order to develop for them, please do the followings.

### Edge:

- Similar to above steps for Chrome

### Firefox:

- run `yarn dev-firefox`
- a new instance of Firefox will open with Gitako automatically installed
- navigate to a GitHub repo and you should see the extension appear
- when you modify source, refresh the tab

### Safari (macOS only):

- run `yarn dev-safari`
- Open `Safari/Gitako/Gitako.xcodeproj` in Xcode
- Click the "Run" button
- Enable developer mode in Safari's preferences
- Enable Gitako in Safari's preferences
- Open a Safari tab and visit a GitHub repo, then activate Gitako via Gitako icon next to the address bar
- when you modify source, click the "Run" button in Xcode and refresh the tab
