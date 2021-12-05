import { Config } from '../@types/config'

/** shall be implemented to check for mistakes ahead of time */
export const check = async (config: Config): Promise<number> => {
  console.log('check: not implemented yet', config)
  // TODO: webhint! https://webhint.io/docs/user-guide/development-flow-integration/local-server/
  return 0
}
