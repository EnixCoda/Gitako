import { Sources } from 'driver/connect'
import * as FileExplorer from './FileExplorer'
import {
  ConnectorState as FileExplorerConnectorState,
  Props as FileExplorerProps,
} from './FileExplorer'
import * as SideBar from './SideBar'
import { ConnectorState as SideBarConnectorState, Props as SideBarProps } from './SideBar'

export const FileExplorerCore: Sources<FileExplorerProps, FileExplorerConnectorState> = FileExplorer
export const SideBarCore: Sources<SideBarProps, SideBarConnectorState> = SideBar
