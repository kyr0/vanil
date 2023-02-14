import { ErrorBoundary, ParentProps } from "solid-js"
import { Body, Head, Html } from "../../runtime"
import PageCss from "global!./page.css"

/** basic page template for built-in pages */
export const Page = (props: ParentProps) => {
    return (
        <Html>
            <Head>
                <PageCss />
            </Head>
            <Body>
                <ErrorBoundary fallback={(e) => <>Sorry, an error occurred: {JSON.stringify(e, null, 2)}</>}>
                    {props.children}
                </ErrorBoundary>
            </Body>
        </Html>
    )
}