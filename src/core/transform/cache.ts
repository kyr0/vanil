import { Context } from '../../@types/context'
const CRC32 = require('crc-32')

/** calculates a CRC32+length hash for input untranspiled code for quick lookup */
export const hashCode = (untranspiledCode: string) => `${CRC32.str(untranspiledCode)}${untranspiledCode.length}`

/** tries to retrieve transpiled code for untranspiled code */
export const getFromCache = (untranspiledCode: string, context: Context): string | undefined => {
  //undefined
  if (!context.codeCache![context.path!]) context.codeCache![context.path!] = {}

  // TODO: cache disabled until re-implementation
  //return undefined
  return context.codeCache![context.path!][hashCode(untranspiledCode)]
}

/** for an untranspiled piece of code, store the transpiled one */
export const addToCache = (untranspiledCode: string, transpiledCode: string, context: Context, force = false) => {
  if (!context.codeCache![context.path!]) context.codeCache![context.path!] = {}

  // TODO: cache disabled until re-implementation
  //if (force) {
  context.codeCache![context.path!][hashCode(untranspiledCode)] = transpiledCode
  //}
  return transpiledCode
}

/** removes the codeCache for an .astro file */
export const invalidateCache = (context: Context) => {
  if (!context.codeCache) context.codeCache = {}
  delete context.codeCache[context.path!]
  return
}
