import { loadTableOfContents } from '../../function/loadTableOfContents'
import { NavSectionTypes } from '../../config/constants'

export const loadContent = (folders: Array<string>) => {
  // TODO: load all .md and transform it to TOC
  return {
    [NavSectionTypes.HOME]: loadTableOfContents(NavSectionTypes.HOME, folders),
    [NavSectionTypes.DOCS]: loadTableOfContents(NavSectionTypes.DOCS, folders),
  }
}
