// relevant for command: dev only
/*
export interface MaterializedPaths {
    [astroPageFilePath: string]: Array<string>
}
*/

/** maps the hash of untranspiled code -> transpiled code */
export interface CodeCache {
  [filePath: string]: {
    [hash: string]: string
  }
}
