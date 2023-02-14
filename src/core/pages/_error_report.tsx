import type { PagePublishError } from "../lang"
import { Component, createEffect, createMemo, createRoot, createSignal, ErrorBoundary, getOwner, ParentComponent, Show } from "solid-js"
import { getContext, renderPage, Title } from "../../runtime"
import { Page } from "./Page"

interface ErrorPagePathMap {
    [pageId: string]: string
}

interface Props extends ErrorPagePathMap {}

const useAsync = (cb: Function) => createRoot(() => {
            
    // TODO: runInContext and getOwner to map async context
        const [error, setError] = createSignal()

        try {
            cb()
        } catch(e) {
            setError(e)
        }
        createEffect(() => {
            if (error()) {
                throw error()
            }
        })

    })

function RenderError(props: { pageId: string }) {
    const [errorReport, setErrorReport] = createSignal<PagePublishError>({
        code: '',
        errorMessage: '',
        location: { filePath: '' },
        reasonCode: ''
    })

    const [error, setError] = createSignal()

    if (!isServer) {
        createEffect(async() => {
           
            const path = `_static-error-reports/${props.pageId}.json`

            // TODO: should catch that error in ErrorBoundary!
            try {
                const data = await fetch(path)
                const errorData = await (data.json())
                setErrorReport(errorData)
                //return errorData
            } catch(e) {
                setError(new Error(`Error report for page with id ${props.pageId} not existing or not readable. Tried to read path: ${path}`))
            }
        })
    }

    createEffect(() => {
        if (!errorReport()) return
        console.log('errorReport?', errorReport())
    })

    createEffect(() => {
        if (error()) {
            throw error()
        }
    })

    const getErrorReport = createMemo(() => {
        const _errorReport = errorReport()

        if (_errorReport.detailsHtml) {
            _errorReport.details = ''
        }
        return _errorReport
    })

    return (
        <>
            <Title>{getErrorReport().code}</Title>

            <h1>{getErrorReport().code}</h1>
            <h2>{getErrorReport().reasonCode}</h2>
            <h3>{getErrorReport().errorMessage}</h3>

            <div innerHTML={getErrorReport().detailsHtml || ' '}></div>

            <Show when={getErrorReport().details}>
                <pre>{getErrorReport().details || ' '}</pre>
            </Show>
            
            <div>
                In file: <u>{getErrorReport().location.filePath} {getErrorReport().location.line ? <> [{errorReport().location.line}</> : ''}{errorReport().location.column ? <>:{errorReport().location.column}]</> : ''}</u>
            </div> 
        </>
    )
}

/** renders an error page that is able to display any SSG generated error report for any page */
function ErrorReportPage(context = getContext<Props>()) {
    const pageId = context.url.searchParams.get('pageId')
    return (
        <Page>
            <Title>Start</Title>
            {/*<Meta name="foo" content={"bar"}></Meta>*/}
            <ErrorBoundary fallback={(err) => <>{err.name}: {err.message}</> }>
                <RenderError pageId={pageId} />
            </ErrorBoundary>
        </Page>
    )
}
export default renderPage(ErrorReportPage)