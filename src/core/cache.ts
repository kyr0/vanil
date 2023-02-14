import { Context } from './context';
import { BinaryToTextEncoding, createHash } from 'crypto';

/** maps the hash of untranspiled code -> transpiled code */
export interface CodeCache {
  [filePath: string]: {
    [hash: string]: string
  }
}

/** calculates a sha1 hash of the content, truncates at 6 chars */
export const hashContent = (content: string, digest: BinaryToTextEncoding = 'hex') => 
    createHash('sha1').update(content).digest(digest).substring(0, 6)

/** quasi-random identifier generator, good for less than 10k values in series */
export const getRandomBase32Identifier = (length: number = 9) => 
    `i${Math.random().toString(36).substring(2, length)}`

/** removes the codeCache for an .astro file */
export const invalidateCache = (pagePath: string, context: Context) => {
  if (!context.codeCache) context.codeCache = {}
  delete context.codeCache[pagePath]
  return
}