import { Context, fetchContent, set } from 'vanil'
import { STORE_KEY_TOC, STORE_KEY_LANGUAGES } from '../config/constants'
import { getLanguagesSupported } from '../function/getLanguagesSupported'
import { loadContent } from './onStart/loadContent'
import { renderBootstrapTheme } from './onStart/renderBootstrapTheme'

export const onStart = async (context: Context) => {
  // render custom bootstrap theme
  renderBootstrapTheme(context)

  // set context property "toc" (table of contents)
  set(STORE_KEY_TOC, loadContent(fetchContent('resolve:../../content/**')))

  // set context property "languages" dynamically based on content available
  set(STORE_KEY_LANGUAGES, getLanguagesSupported(fetchContent('resolve:../../content/**')))
}
