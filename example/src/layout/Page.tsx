import { Accessor, createEffect, createMemo, createSignal, JSX, JSXElement, onCleanup, onError, ParentProps, Setter, sharedConfig, untrack } from "solid-js"
import { Body, Head, Html } from "../../../dist/runtime"
import PageCss from "global!../page.css"


interface ErrorBoundaryProps extends ParentProps {
    fallback: (err: Error, reset: () => void) => JSXElement
}

export const ErrorBoundary = (props: ErrorBoundaryProps) => {
    const [cmp, setCmp] = createSignal(<>Loading...</>)
    setCmp(<>Loading...1</>)
    createEffect(() => {
        try {
            setCmp(<>{() => props.children}</>)
        } catch(e) {
            console.log('boundary err!', e)

            setCmp(<div>Fallback!</div>)
            /*
            setCmp(props.fallback(e, () => {
                console.log('reset clicked')
                setCmp(<>{() => props.children}</>)
            }))
            */
        } finally {

            setCmp(<div>Fallback!</div>)
        }
    })
    return <>{cmp()}</>
}


export const Page = (props: ParentProps) => {
    return (
        <Html lang="de">
            <Head>
                <PageCss />
            </Head>
            <Body>
                {props.children}
            </Body>
        </Html>
    )
}