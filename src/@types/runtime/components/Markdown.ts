export interface MarkdownProps {
  src?: string
  children?: Array<VDOMNode>
}

/** renders Markdown as a VDOM */
export type MarkdownFn = (props: MarkdownProps) => VDOMNode
