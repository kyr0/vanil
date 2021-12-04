export interface Option {
  [variable: string]: string
}

export type TFunction = (key: string, options?: Option) => string

export interface NamespaceTranslation {
  [namespace: string]: { [key: string]: string }
}

export interface Translations {
  [language: string]: NamespaceTranslation
}

export interface i18nApi {
  language: string
  nsTranslation: string | undefined
  translations: Translations
  changeLanguage: (language: string) => void
  t: (namespace: string, options?: Option) => TFunction | string
  setTranslations: (language: string, translations: NamespaceTranslation) => i18nApi
}