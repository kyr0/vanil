import { props } from 'vanil'

export type NavSectionType = 'home' | 'docs' | 'blog' | 'snippets' | 'examples'

export enum NavSectionTypes {
  HOME = 'home',
  DOCS = 'docs',
  BLOG = 'blog',
  SNIPPETS = 'snippets',
  EXAMPLES = 'examples',
}

export const setNavSectionActive = (name: NavSectionType) => (props.navSectionActive = name)
