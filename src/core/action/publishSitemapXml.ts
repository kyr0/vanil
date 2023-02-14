
import { getDistFolder, toProjectRootRelativePath } from '../io/folder'
import { getPageUrl } from '../routing'
import { parse } from 'js2xmlparser'
import * as colors from 'kleur/colors'
import { writeFileToDistFolder } from '../io/file'
import { Context } from '../context'
import { sep } from 'path'

interface SitemapUrl {
  loc: string
  lastmod?: string // YYYY-MM-DD
  changefreq?: string // e.g. daily
  priority?: string // e.g. 1.0
}

const genSitemapUrl = (url: string): SitemapUrl => ({
  loc: url,
})

export const publishSitemapXml = async (context: Context) => {
  if (context.config.buildOptions?.sitemap && context.renderedPagePaths) {
    const distFolder = getDistFolder(context.config)

    console.log(
      colors.bold(colors.dim('action (publishSitemapXml):')),
      colors.gray(`Generating ${toProjectRootRelativePath(distFolder, context.config)}${sep}sitemap.xml`),
    )

    const pageUrls: Array<SitemapUrl> = [
      {
        loc: context.config.buildOptions.site!,
        lastmod: new Date().toISOString().substring(0, 10),
        changefreq: 'daily',
        priority: '1.0',
      },
    ]

    const templatePaths = Object.keys(context.renderedPagePaths)

    // walk all .astro page template paths
    templatePaths.forEach((templatePath) => {
      const materializedPagePaths = context.renderedPagePaths![templatePath]

      // walk all materialized HTML pages
      materializedPagePaths.forEach((pagePath) =>
        pageUrls.push(genSitemapUrl(getPageUrl(pagePath.replace(distFolder, ''), context))),
      )
    })

    // transform to https://www.sitemaps.org/protocol.html
    // and persist in dist folder, sitemap.xml
    await writeFileToDistFolder(
      'sitemap.xml',
      parse('urlset', {
        '@': {
          xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        },
        url: pageUrls,
      }),
      context,
    )
  }
}
