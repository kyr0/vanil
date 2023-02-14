import { renderPage, Title } from "../../runtime"
import { Page } from "./Page"

/** renders the built-in 404 not found page */
const NotFoundPage = () => {
    return () => (
        <Page>
            <Title>404 - page not found</Title>   
            Page not found
        </Page>
    )
}
export default renderPage(NotFoundPage)