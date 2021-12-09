import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { Context } from 'vanil'
import { render } from 'sass'

export const onStart = async (context: Context) => {
  console.log('Building custom Bootstrap SCSS...')

  render({ file: resolve(__dirname, '../custom.scss') }, (err: Error, result: any) => {
    if (err) {
      console.error('Sass comile error', err)
      return
    }
    writeFileSync(resolve(context.paths.dist, 'bootstrap-custom.css'), result.css.toString('utf-8'), {
      encoding: 'utf-8',
    })
  })
}
