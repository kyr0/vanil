import { getLanguagesSupported } from './getLanguagesSupported'
import { NavSectionType } from './setNavSectionActive'

interface PageMaterialization {
  params: {
    section: string
    lang: string
    page: string
  }
  props: {
    lang: string
    contentFilePath: string
  }
}

/** load all content/*.md files as a table of contents, compatible to the router datamodel */
export const loadTableOfContents = (section: NavSectionType, folders: Array<string>) => {
  const languagesSupported = getLanguagesSupported(folders)
  const materizations: Array<PageMaterialization> = []

  for (let l = 0; l < languagesSupported.length; l++) {
    const lang = languagesSupported[l]

    for (let i = 0; i < folders.length; i++) {
      const c = folders[i]
        // rel dir split, no leading slash
        // by language and section
        .split(`/content/${lang}/${section}/`)

      // match is only given if there is actually a split result of 2
      if (c.length === 2) {
        const sectionAndPage = c[1].split('/')
        const pageSection = sectionAndPage[1] ? sectionAndPage[0] : null
        const page = (sectionAndPage[1] ? sectionAndPage[1] : sectionAndPage[0]).replace('.md', '')

        materizations.push({
          params: {
            lang,
            section: pageSection,
            page,
          },
          // TODO: loop and generate alternative lang page links
          props: {
            lang,
            contentFilePath: folders[i],
          },
        })
      }
    }
  }
  return materizations
}
