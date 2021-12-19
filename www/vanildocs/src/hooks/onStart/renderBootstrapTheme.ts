import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { Context, restartOnFileChange } from 'vanil'
import { renderSync } from 'sass'

export const renderBootstrapTheme = (context: Context) => {
  console.log('Building custom Bootstrap SCSS...')

  const dt = Date.now()

  try {
    const scssIndexFile = resolve(__dirname, '../../styles/_index.scss')
    const result = renderSync({ file: scssIndexFile, verbose: true })

    if (result.stats.includedFiles) {
      result.stats.includedFiles.forEach((dependentFile) => {
        // re-start "dev" mode on file change (will trigger onStart again -> HMR effect)
        restartOnFileChange(dependentFile)
      })
    }

    writeFileSync(resolve(context.paths.dist, 'index.css'), result.css.toString('utf-8'), {
      encoding: 'utf-8',
    })
  } catch (e) {
    if (e) {
      console.error('Sass comile error', e)
      return
    }
  }
  console.log('Done in', Date.now() - dt, 'ms')
}
