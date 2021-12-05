import { readFileSync } from 'fs'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'

/** returns a files binary data */
export const binaryLoader: LoaderFn = (targetPath: string) => readFileSync(targetPath, { encoding: 'binary' })

export const registerBinaryLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'binary',
  // the fabulous nay-sayer matcher:
  // always negates what it was asking for
  match: /\s^\s\S^\S/,
  cb: binaryLoader,
})
