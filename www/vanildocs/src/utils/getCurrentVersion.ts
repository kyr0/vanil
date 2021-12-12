import { readFileSync } from 'fs'
import { resolve } from 'path'

export const getCurrentVersion = () =>
  JSON.parse(readFileSync(resolve(__dirname, '../../../../package.json'), { encoding: 'utf-8' })).version
