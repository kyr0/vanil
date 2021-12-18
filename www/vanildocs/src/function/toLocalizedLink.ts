import { props } from 'vanil'

export const toLangLink = (href: string) => `/${props.lang}${href}`
