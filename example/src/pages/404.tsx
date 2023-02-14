import { Page } from "../layout/Page"
import { renderPage } from "../../../dist/runtime"

const NotFound = () => {
  return (
    <Page title="404 - not found">
        <div>404 - not found</div>
    </Page>
  ) 
} 
export default renderPage(NotFound)