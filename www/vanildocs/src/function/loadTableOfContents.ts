import { getLanguagesSupported } from './getLanguagesSupported'
import { NavSectionType } from './setNavSectionActive'

interface PageMaterialization {
  params: {
    section: string | null
    lang: string
    page: string
  }
  props: {
    slug: string
    i18nLinks?: {
      [slug: string]: {
        [lang: string]: string
      }
    }
    lang: string
    contentFilePath: string
  }
}

/** splices "1_foo" to "1" or "A_bar" to A to identify/match data records by id */
export const getId = (name: string) => name.split('_')[0] || ''

/** constructs the slug path per route (custom logic) */
export const generateSlug = (lang: string, navSection: NavSectionType, page: string, section?: string) => {
  if (page === 'index') page = ''
  if (navSection && navSection !== 'home') {
    const langAndNav = `/${lang}/${navSection}`
    if (section) {
      return `${langAndNav}/${section}/${page}`
    } else {
      return `${langAndNav}/${page}`
    }
  } else {
    return `/${lang}/${page}`
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
          props: {
            slug: generateSlug(lang, section, page, pageSection),
            lang,
            contentFilePath: folders[i],
          },
        })
      }
    }
  }

  materizations.forEach((materization) => {
    const slug: string = materization.props.slug

    if (!materization.props.i18nLinks) {
      materization.props.i18nLinks = {}
    }

    if (!materization.props.i18nLinks[slug]) {
      materization.props.i18nLinks[slug] = {
        [materization.params.lang]: materization.props.slug,
      }
    }

    const sectionId = getId(materization.params.section || '')
    const pageId = getId(materization.params.page)

    materizations.forEach((materizationCandidate) => {
      if (
        sectionId === getId(materizationCandidate.params.section || '') &&
        pageId === getId(materizationCandidate.params.page)
      ) {
        materization.props.i18nLinks[slug][materizationCandidate.params.lang] = materizationCandidate.props.slug
      }
    })
  })
  return materizations
}
