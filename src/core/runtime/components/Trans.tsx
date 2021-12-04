export interface TransProps {
    key: string
    values?: object
    ns?: string
    html?: boolean
    tag?: string
}

/** translation impl. as a component; supports HTML, namepaces and arbitrary tags */
export const Trans = ({ tag, key, values, ns, html}: TransProps) => {
    const t: Function = ns ? Vanil.t(ns) as Function : Vanil.t
    const Tag = typeof tag !== 'undefined' ? tag : undefined
    const translation = t(key, values)

    // @ts-ignore
    return <Tag innerHTML={html ? translation : ''}>{ html ? '' : translation}</Tag>
}
Vanil.Trans = Trans