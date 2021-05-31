import { Sources } from 'driver/connect'
import * as FileExplorer from './FileExplorer'
import {
  ConnectorState as FileExplorerConnectorState,
  Props as FileExplorerProps,
} from './FileExplorer'

export const FileExplorerCore: Sources<FileExplorerProps, FileExplorerConnectorState> = FileExplorer
