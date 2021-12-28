import { loadTableOfContents } from '../../function/loadTableOfContents'
import { NavSectionTypes } from '../../config/constants'

export const loadContent = (folders: Array<string>) => {
  return {
    [NavSectionTypes.HOME]: loadTableOfContents(NavSectionTypes.HOME, folders),
    [NavSectionTypes.DOCS]: loadTableOfContents(NavSectionTypes.DOCS, folders),
  }
}
