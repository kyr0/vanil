export interface TransformFnOptions {
  projectBaseDir?: string
  project?: string
  rewrite?(importPath: string, sourceFilePath: string, localName: string): string
  alias?: Record<string, string>
}
