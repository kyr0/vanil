/** maps from the .astro file path to the actual .html file paths in dist folder */

export interface MaterializedHtmlFilePaths {
  [astroPageFilePath: string]: Array<string>
}
