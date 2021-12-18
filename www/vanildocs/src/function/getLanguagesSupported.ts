import { props } from 'vanil'

/** returns the languages supported dynamically, based on content available */
export const getLanguagesSupported = (folders: Array<string>): Array<string> => {
  if (!props.languagesSupported) {
    const langs = []

    for (let i = 0; i < folders.length; i++) {
      const c = folders[i]
        // rel dir split, no leading slash
        .split('/content/')[1]
        // lang dir split
        .split('/')[0]
        // uniform casing
        .toLowerCase()

      // ISO lang && no duplicates
      if (c.length === 2 && langs.indexOf(c) == -1) {
        langs.push(c)
      }
    }
    props.languagesSupported = langs
  }
  return props.languagesSupported
}
