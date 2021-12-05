export interface ScriptProps {
  src: string
  type?: string
  children?: Array<string>
}

/** component for <script> injection that will prevent double-injection */
export type ScriptFn = (props: ScriptProps) => VDOMNode
