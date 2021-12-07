import shelljs from 'shelljs'
import { Config } from '../@types/config'
import * as colors from 'kleur/colors'
import { getDistFolder } from '../core/io/folders'

/** removes the projects dist folder to clean the cache */
export const clean = (config: Config) => {
  console.log('Removing folder:', colors.green(config.dist!))

  shelljs.rm('-rf', getDistFolder(config))

  return 0
}
