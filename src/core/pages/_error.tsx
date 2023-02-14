import type { Command } from "../commands"
import { Show } from "solid-js"
import { renderPage, getContext, Html, Head, Body, Title } from "../../runtime"

interface Props {
    command: Command
}

/** default general error page */
const ErrorPage = ({ mode, id, props } = getContext<Props>()) => {
    return () => (
        <Html>
            <Head>
                <Title>error</Title>
            </Head>
            <Body>
                An error has occurred while generating this page.
                <pre>{JSON.stringify(props, null, 2)}</pre>
                <Show when={props.command === 'dev'}>
                    <fieldset>
                        {/** TODO: support base subDir */}
                        <a href={`/_error_report.html?pageId=${id}`}>Find details here.</a>
                        <i>(This section is only visible when the 'dev' command is used)</i>
                    </fieldset>
                </Show>
            </Body>
        </Html>
    )
}
export default renderPage(ErrorPage)