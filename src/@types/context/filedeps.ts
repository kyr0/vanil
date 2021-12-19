// relevant for command: dev only
export interface FileDependencyLinkList {
  // file path (absolute) linked to list of .astro template files associated
  // can be n-depth nested, but is represented here as a 2d list
  [filePath: string]: Array<string>
}
