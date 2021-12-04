import { i18nApi, NamespaceTranslation, TFunction } from "../../@types/runtime/i18n"

const VARIABLE_REGEX = /{([^}]*)}/g

Vanil.translations = Vanil.translations ? Vanil.translations : {}
Vanil.language = Vanil.language ? Vanil.language : 'en'

Vanil.changeLanguage = (language: string) => {
  Vanil.language = language

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languagechange', { detail: language }))
  }
}

const init = (namespace: string | undefined, key: string) => {
  const { language, translations } = Vanil;

  const namespaces = translations[language] || {}
  if (Vanil.mode === 'development' && typeof translations[language] === 'undefined') {
    console.warn(`(i18n) Missing language [language=${language}]`)
  }

  let pairs
  if (typeof namespace === 'undefined') {
    pairs = translations[language]
  } else {
    pairs = namespaces[namespace] || {}
    if (Vanil.mode === 'development' && typeof namespaces[namespace] === 'undefined') {
        console.warn(`(i18n) Missing namespace [language=${language} ns=${namespace}]`)
    }
  }

  const translation = pairs[key] || key
  if (Vanil.mode === 'development' && typeof pairs[key] === 'undefined') {
    console.warn(`(i18n) Missing key [language=${language} namespace=${namespace} key=${key}]`)
  }
  return { namespace, translation, language }
}

const translate = (ns: string|undefined, key: string, options = {}): string => {
    const config = init(ns, key)
    let { translation } = config
    const { language, namespace } = config

    const consumedOptions: any = Object.assign({}, options)
    const optionKeys = (translation as string).match(VARIABLE_REGEX) || []

    for (let index = 0; index < optionKeys.length; index++) {
        const optionRawKey = optionKeys[index]

        // skip duplicates
        if (optionKeys.indexOf(optionRawKey) !== index) continue

        const optionKey = optionRawKey.substr(1, optionRawKey.length - 2)

        const optionValue = consumedOptions[optionKey] || ''

        if (Vanil.mode === 'development' && typeof consumedOptions[optionKey] === 'undefined') {
            console.warn(`(i18n) Missing option [lng=${language} ns=${namespace} key=${key} opt=${optionKey}]`)
        }

        delete consumedOptions[optionKey]

        // fast replace of all duplicates
        translation = (translation as string).split(`{${optionKey}}`).join(optionValue)
    }

    // istanbul ignore else
    if (Vanil.mode === 'development') {
        const unusedOptions = Object.keys(consumedOptions)
        for (let index = 0; index < unusedOptions.length; index++) {
            console.info(`(i18n) Unknown option [lng=${language} ns=${namespace} key=${key}, opt=${unusedOptions[index]}]`)
        }
    }
    return (translation as string)
}

Vanil.t = (nsOrKey: string, options = {}): TFunction | string => {

  const type = typeof Vanil.translations[Vanil.language][nsOrKey]

    if (type === 'string') {
      // return translation w/o namespace
      return translate(undefined, nsOrKey, options)
    } else if (type === 'object') {
        // return a namespaced translation function
        return (key: string, options = {}) => 
          translate(nsOrKey, key, options)
    } else {
      // no translation available; fallback to input
      return nsOrKey
    }
}

Vanil.setTranslations = (language: string, namespaceTranslation: NamespaceTranslation): i18nApi => {
    Vanil.translations[language] = namespaceTranslation
    return Vanil
}
