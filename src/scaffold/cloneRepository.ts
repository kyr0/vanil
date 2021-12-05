import { execSync } from 'child_process'

export const cloneRepository = async (url: string): Promise<string> => {
  const cloneDir = '.clone'

  execSync(`rm -rf ${cloneDir}`, {
    stdio: 'inherit',
  })

  execSync(`mkdir -p ${cloneDir}`, {
    stdio: 'inherit',
  })

  execSync(`git clone ${url} ${cloneDir}`, {
    stdio: 'inherit',
  })

  return cloneDir
}
