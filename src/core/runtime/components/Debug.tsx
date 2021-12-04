export interface DebugProps {
    [key: string]: any
}

export const Debug = (props: DebugProps) => {
    delete props.children
    return <Vanil.Code code={JSON.stringify(props, null, 2)} lang="json" theme="okaidia" />
}
Vanil.Debug = Debug