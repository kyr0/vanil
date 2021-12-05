import { DebugFn, DebugProps } from "../../../@types/runtime/components/Debug"

export const Debug: DebugFn = (props: DebugProps) => {
    delete props.children
    return <Vanil.Code code={JSON.stringify(props, null, 2)} lang="json" theme="okaidia" />
}
Vanil.Debug = Debug