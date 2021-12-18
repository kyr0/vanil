import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { Context } from 'vanil'
import { renderSync } from 'sass'

export const renderBootstrapTheme = (context: Context) => {
  console.log('Building custom Bootstrap SCSS...')

  const dt = Date.now()

  try {
    const result = renderSync({ file: resolve(__dirname, '../../custom.scss'), verbose: true })

    writeFileSync(resolve(context.paths.dist, 'bootstrap-custom.css'), result.css.toString('utf-8'), {
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
