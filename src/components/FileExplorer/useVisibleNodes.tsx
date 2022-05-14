import { useEffect, useState } from 'react'
import { VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useVisibleNodes(visibleNodesGenerator: VisibleNodesGenerator | null) {
  const [visibleNodes, setVisibleNodes] = useState<VisibleNodes | null>(null)
  useEffect(() => visibleNodesGenerator?.onUpdate(setVisibleNodes), [visibleNodesGenerator])
  return visibleNodes
}
