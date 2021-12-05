import { ScriptFn, ScriptProps } from "../../../@types/runtime/components/Script"

/** component for <script> injection that will prevent double-injection */
export const Script: ScriptFn = (props: ScriptProps) => {

    // runtime-interactive multi-load prevention for scripts with source
    if (props.src) {

        if (
            (typeof document !== 'undefined' && !document.querySelector(`script[src="${props.src}"]`)) ||
            typeof document === 'undefined' // SSG mode, see tsx.ts for alternative multi-inject prevention
        ) {
            return <script {...props}></script>
        }
        return <></>
    } else {

        const scriptCode = props.children ? props.children[0] : ''
        delete props.children
        return <script {...props}>{ scriptCode }</script>
    }
}
Vanil.Script = Script