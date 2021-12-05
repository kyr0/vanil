import { SourceLanguageType } from '../../core/transform/transpile'

export interface StyleReplacement {
  original: string
  replacement: string

  // e.g. scss
  lang: SourceLanguageType
}
