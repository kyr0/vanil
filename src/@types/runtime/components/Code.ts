export interface CodeProps {
  code: string
  lang?: string
  theme?: string
  wrap?: boolean
}

export type CodeFn = ({ code, lang, theme, wrap }: CodeProps) => VDOMNode
