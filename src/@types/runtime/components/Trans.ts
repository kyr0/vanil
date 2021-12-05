export interface TransProps {
  key: string
  values?: object
  ns?: string
  html?: boolean
  tag?: string
}

/** translation impl. as a component; supports HTML, namepaces and arbitrary tags */
export type TransFn = ({ tag, key, values, ns, html }: TransProps) => VDOMNode
