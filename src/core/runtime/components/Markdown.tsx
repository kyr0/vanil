import { existsSync } from "fs"
import { resolve } from "path"
import { MarkdownFn, MarkdownProps } from "../../../@types/runtime/components/Markdown"
import { readFileSyncUtf8 } from "../../io/file"
import { markdownToVdom } from "../../loader/core/mdvdom"
import { addFileDependency } from "../../transform/context"

/** renders Markdown as a VDOM */
export const Markdown: MarkdownFn = (props: MarkdownProps) => {

    // local file referenced; use it
    if (props.src && existsSync(props.src)) {
        addFileDependency(resolve(props.src), Vanil.props.context)
        return markdownToVdom(readFileSyncUtf8(props.src), Vanil.props.context)
    }

    // content set as children; use that (should be wrapped in {`# markdown _content_`})
    if (props.children && props.children[0]) {
        return markdownToVdom(props.children[0], Vanil.props.context)
    }
    return <></>
}
Vanil.Markdown = Markdown