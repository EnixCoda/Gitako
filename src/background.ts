import addDomainPermissionToggle from 'webext-domain-permission-toggle'
import 'webext-dynamic-content-scripts'

addDomainPermissionToggle({
  title: 'Enable Gitako on this domain',
  reloadOnSuccess: 'Refresh to activate Gitako?',
})
