export interface DebugProps {
  [key: string]: any
}

export type DebugFn = (props: DebugProps) => VDOMNode
