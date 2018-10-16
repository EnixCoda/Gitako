import DOMHelper from 'utils/DOMHelper'

const init = dispatch => () => {
  DOMHelper.decorateGitHubPageContent()
}

export default {
  init,
}
