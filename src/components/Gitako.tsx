import { raiseError } from 'analytics'
import { SideBar } from 'components/SideBar'
import { ConfigsContext, ConfigsContextWrapper } from 'containers/ConfigsContext'
import * as React from 'react'

export class Gitako extends React.PureComponent {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    raiseError(error, errorInfo)
  }

  render() {
    return (
      <ConfigsContextWrapper>
        <ConfigsContext.Consumer>
          {configContext => configContext && <SideBar configContext={configContext} />}
        </ConfigsContext.Consumer>
      </ConfigsContextWrapper>
    )
  }
}
