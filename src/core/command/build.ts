import { Context, validateContext } from "../context"
import { publishPublicFolder, publishRobotsTxt, publishSitemapXml } from "../action"
import { publishPages } from "../page"

/** default build pipeline for pages: 
 * publish: 0) clean 1) public folder 2) pages 3) robots.txt 4) sitemap.xml */
export const build = async(partialContext: Partial<Context>) => {
    const context = validateContext({
        ...partialContext,
        command: 'build'
    })

    await publishPublicFolder(context)
    
    const pagesPublished = await publishPages(context)

    await publishRobotsTxt(context)
    await publishSitemapXml(context)

    return {
        context,
        pagesPublished
    }
}