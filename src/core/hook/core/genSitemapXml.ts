import { Context } from "../../../@types/context"
import { getDistFolder } from "../../io/folders"
import { getPageUrl } from "../../transform/routing"
import { HookFn } from "../hook"
import { parse } from "js2xmlparser"
import { persistFileDist } from "../../transform/persist"

interface SitemapUrl {
    loc: string
    lastmod?: string // YYYY-MM-DD
    changefreq?: string // e.g. daily
    priority?: string // e.g. 1.0
}

const genSitemapUrl = (url: string): SitemapUrl => ({
    loc: url
})

export const genSitemapXml: HookFn = async(context: Context, props: any) => {

    if (context.config.buildOptions?.sitemap && context.materializedHtmlFilePaths) {

        console.log('[hook:genSitemapXml] Generating sitemap.xml...')

        const distFolder = getDistFolder(context.config)

        const pageUrls: Array<SitemapUrl> = [{
            loc: context.config.buildOptions.site!,
            lastmod: new Date().toISOString().substring(0, 10),
            changefreq: 'daily',
            priority: '1.0'
        }]   

        const templatePaths = Object.keys(context.materializedHtmlFilePaths)

        // walk all .astro page template paths
        templatePaths.forEach(templatePath => {
            const materializedPagePaths = context.materializedHtmlFilePaths![templatePath]

            // walk all materialized HTML pages
            materializedPagePaths.forEach(pagePath => 
                pageUrls.push(
                    genSitemapUrl(
                        getPageUrl(pagePath.replace(distFolder, ''), context)
                    )
                )
            )
        })

        // transform to https://www.sitemaps.org/protocol.html
        // and persist in dist folder, sitemap.xml
        persistFileDist('sitemap.xml', parse("urlset", {
            "@": {
                xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"
            },
            url: pageUrls,
        }), context)
    }
}