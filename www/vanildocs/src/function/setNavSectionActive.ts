import { props } from 'vanil'

export type NavSectionType = 'home' | 'docs' | 'blog' | 'snippets' | 'examples'

export const setNavSectionActive = (name: NavSectionType) => (props.navSectionActive = name)
