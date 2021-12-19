import { setTranslations, NamespaceTranslation, restartOnFileChange } from 'vanil'

interface TranslationFile {
  lang: string
  file: string
  translations: NamespaceTranslation
}

export const loadTranslations = (translationFiles: Array<TranslationFile>) => {
  translationFiles.forEach((translationFile) => {
    // re-start "dev" mode on file change (will trigger onStart again -> HMR effect)
    restartOnFileChange(translationFile.file)

    // load and set translations; it's remembered in browser
    setTranslations(translationFile.lang, translationFile.translations)
  })
}
