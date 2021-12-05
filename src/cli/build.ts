import { Config } from '../@types/config'
import { orchestrateTransformAll } from '../core/orchestrate'
import { clean } from './clean'

/**
 * cleans the dist folder and then builds in production mode,
 * therefore code optimizations are activated
 * (resulting code is not debuggable anymore)
 */
export const build = async (config: Config) => {
  // clean first
  await clean(config)

  await orchestrateTransformAll({
    config,
    command: 'build',
    mode: 'production',
  })
  return 0
}
