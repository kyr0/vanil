import { readFileSync } from 'fs'
import { resolve } from 'path'

export const getCurrentVersion = () =>
  JSON.parse(readFileSync(resolve('../../../../package.json'), { encoding: 'utf-8' })).version
