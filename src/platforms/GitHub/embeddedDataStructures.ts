import * as s from 'superstruct'

const repo = s.object({
  id: s.number(),
  defaultBranch: s.string(),
  name: s.string(),
  ownerLogin: s.string(),
  currentUserCanPush: s.boolean(),
  isFork: s.boolean(),
  isEmpty: s.boolean(),
  createdAt: s.string(),
  ownerAvatar: s.string(),
  public: s.boolean(),
  private: s.boolean(),
  isOrgOwned: s.boolean(),
})

const user = s.object({
  id: s.number(),
  login: s.string(),
  userEmail: s.string(),
})

const rel = s.object({
  name: s.string(),
  listCacheKey: s.string(),
  canEdit: s.boolean(),
  refType: s.string(),
  currentOid: s.string(),
})

const treeItem = s.object({
  name: s.string(),
  path: s.string(),
  contentType: s.string(),
})

const tree = s.object({
  items: s.array(treeItem),
  templateDirectorySuggestionUrl: s.nullable(s.never()),
  readme: s.nullable(s.never()),
  totalCount: s.number(),
  showBranchInfobar: s.boolean(),
})

const repoPayload = s.object({
  allShortcutsEnabled: s.boolean(),
  path: s.string(),
  repo: repo,
  currentUser: user,
  refInfo: rel,
  tree: tree,
  fileTree: s.nullable(s.never()),
  fileTreeProcessingTime: s.nullable(s.never()),
  foldersToFetch: s.array(s.unknown()),
  treeExpanded: s.boolean(),
  symbolsExpanded: s.boolean(),
  isOverview: s.boolean(),
  overview: s.unknown(),
})

const reposOverview = s.object({
  props: s.object({
    initialPayload: repoPayload,
    appPayload: s.unknown(),
  }),
})
const app = s.object({
  payload: repoPayload,
})

export const embeddedDataStruct = {
  repo,
  user,
  rel,
  treeItem,
  tree,
  repoPayload,
  reposOverview,
  app,
}
