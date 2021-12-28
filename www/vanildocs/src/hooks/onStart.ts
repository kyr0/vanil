import { resolve } from 'path'
import { Context, fetchContent, set } from 'vanil'
import { STORE_KEY_TOC, STORE_KEY_LANGUAGES } from '../config/constants'
import { getLanguagesSupported } from '../function/getLanguagesSupported'
import { loadContent } from './onStart/loadContent'
import { loadTranslations } from './onStart/loadTranslations'
import { renderBootstrapTheme } from './onStart/renderBootstrapTheme'

export const onStart = async (context: Context) => {
  // render custom bootstrap theme
  renderBootstrapTheme(context)

  // set context property "languages" dynamically based on content available
  const languagesSupported = getLanguagesSupported(fetchContent('resolve:../../content/**'))
  set(STORE_KEY_LANGUAGES, languagesSupported)

  // sets translations in Vanil.i18n runtime state
  loadTranslations(
    languagesSupported.map((lang) => ({
      lang,
      file: resolve(__dirname, `../i18n/${lang}.json5`),
      translations: fetchContent(`../i18n/${lang}.json5`)[0],
    })),
  )

  // set context property "toc" (table of contents)
  set(STORE_KEY_TOC, loadContent(fetchContent('resolve:../../content/**')))
}
