import { writeFileToDistFolder } from '../io/file'
import * as colors from 'kleur/colors'
import { toProjectRootRelativePath, getDistFolder } from '../io/folder'
import { Context } from '../context'
import { RobotsTxtOptions } from '../config'
import { sep } from 'path'

const EOL = '\n'

export const publishRobotsTxt = async (context: Context) => {
  writeFileToDistFolder('robots.txt', render(context.config.buildOptions?.robotsTxt!, context), context)
}

const toArray = (value: any) => {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  return [value]
}

const render = (config: Array<RobotsTxtOptions> | RobotsTxtOptions, context: Context) => {
  console.log(
    colors.bold(colors.dim('action (publishRobotsTxt):')),
    colors.gray(`Generating ${toProjectRootRelativePath(getDistFolder(context.config), context.config)}${sep}robots.txt`),
  )

  let SitemapArray: Array<string> = []
  let HostArray: Array<string> = []

  let output = toArray(config)
    .map((robot: RobotsTxtOptions) => {
      let userAgentArray: Array<string> = []

      if (robot.userAgent && Array.isArray(robot.userAgent)) {
        userAgentArray = robot.userAgent.map((userAgent: string) => `User-agent: ${userAgent}`)
      } else if (robot.userAgent) {
        userAgentArray.push(`User-agent: ${robot.userAgent}`)
      }

      if (robot.crawlDelay) {
        userAgentArray.push(`Crawl-delay: ${robot.crawlDelay}`)
      }

      if (robot.sitemap) {
        SitemapArray = SitemapArray.concat(robot.sitemap)
      }

      if (robot.host) {
        HostArray = HostArray.concat(robot.host)
      }

      return userAgentArray
        .concat(
          toArray(robot.disallow).map((disallow) => {
            if (Array.isArray(disallow)) {
              return disallow.map((line) => `Disallow: ${line}`).join('\n')
            }
            return `Disallow: ${disallow}`
          }),
        )
        .join(EOL)
    })
    .join(EOL)

  if (SitemapArray.length > 0) {
    output += `${EOL}${SitemapArray.map((sitemap) => `Sitemap: ${sitemap}`).join(EOL)}`
  }
  if (HostArray.length > 0) {
    output += `${EOL}${HostArray.map((host) => `Host: ${host}`).join(EOL)}`
  }
  return output
}
