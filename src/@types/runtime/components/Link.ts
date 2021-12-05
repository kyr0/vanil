export interface LinkProps {
  href: string
  rel?: string
}

/** component for <likn> injection that will prevent double-injection */
export type LinkFn = (props: LinkProps) => VDOMNode
