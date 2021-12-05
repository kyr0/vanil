import { TransFn, TransProps } from "../../../@types/runtime/components/Trans"

/** translation impl. as a component; supports HTML, namepaces and arbitrary tags */
export const Trans: TransFn = ({ tag, key, values, ns, html}: TransProps) => {
    const t: Function = ns ? Vanil.t(ns) as Function : Vanil.t
    const Tag = typeof tag !== 'undefined' ? tag : undefined
    const translation = t(key, values)

    // @ts-ignore
    return <Tag innerHTML={html ? translation : ''}>{ html ? '' : translation}</Tag>
}
Vanil.Trans = Trans