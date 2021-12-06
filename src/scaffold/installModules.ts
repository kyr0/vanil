import { spawn } from 'cross-spawn'
import { concatErrors } from './concatErrors'

export const installModules = async (projectRootDir: string, dependencies: string[], devDependencies: string[]) => {
  await new Promise((resolve, reject) => {
    console.log()
    console.log('Installing dependencies...')

    const child = spawn('npm', ['--prefix', projectRootDir, 'install', ...dependencies], { stdio: 'inherit' })

    child.on('close', (code: number) => {
      if (code !== 0) {
        concatErrors([`npm exited with error code: ${code}`])
        reject(code)
      } else {
        resolve(undefined)
      }
    })
  })
  await new Promise((resolve, reject) => {
    process.chdir(projectRootDir)

    console.log('Installing dev dependencies...')

    const child = spawn('npm', ['--prefix', projectRootDir, 'install', ...devDependencies, '--save-dev'], {
      stdio: 'inherit',
    })

    child.on('close', async (code: number) => {
      if (code !== 0) {
        concatErrors([`npm exited with error code: ${code}`])
        reject(code)
      } else {
        resolve(undefined)
      }
    })
  })

  return true
}
