
import { Context } from './context'
import { config as dotEnvConfig } from 'dotenv'
import { resolve } from 'path'
import { getProjectRootFolder } from './io'

export interface EnvironmentVariables {
  [key: string]: string
}

export interface PublicAndPrivateEnvVariables {
  public: EnvironmentVariables,
  private: EnvironmentVariables
}

/** loads the .env files and sets them in process.env */
export const readDotEnv = (partialContext: Partial<Context>): PublicAndPrivateEnvVariables => {

  const envVariables: PublicAndPrivateEnvVariables = {
    private: {},
    public: {}
  }

  // read project .env files
  dotEnvConfig({ path: resolve(getProjectRootFolder(partialContext.config), '.env') })

  Object.entries(process.env).forEach(([key, value]) => {
    if (key.split('_')[0] === partialContext.config.envPrefix) {
      envVariables.public[key] = value
    } else  {
      envVariables.private[key] = value
    }
  })
  return envVariables
}
