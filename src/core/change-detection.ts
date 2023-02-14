import { resolve } from "path"
import { Context } from "./context"
import { getProjectRootFolder, getPublicFolder } from "./io"
import { isPage } from "./page"
import { invalidateCache } from "./cache"
import { debounce } from "./time"
import { watch } from 'chokidar'
import { publishPublicFolder } from "./action"
import { notifyPageChange } from "./live-reload"

export const publicFolderChangeCopyDebounceMs = 25
export const fileChangeDebounceMs = 75

export interface ChangeDetectionOptions {
    onDependencyToRestartOnChanged?: (path: string) => void
    onPagesChanged?: (paths: Array<string>) => void
}

/** starts a chokidar file change listener that triggers page rebuilds on change of page files or their dependencies */
export const watchForCodeChanges = (options: ChangeDetectionOptions, context: Context) => {

  // force reload all pages if re-connected with existing client (sync)
  notifyPageChange('*', 'html', 'publish', context)

  const projectDir = getProjectRootFolder(context.config)
  const excludedFolders = context.config.devOptions.excludedFolders.map(path => resolve(projectDir, path))

  const isInExcludedFolder = (path: string): boolean => {
    let isExcluded = false
    excludedFolders.forEach((excludedFolder) => {
      if (path.indexOf(excludedFolder) > -1) {
        isExcluded = true
      }
    })
    return isExcluded
  }

  const handleFileChange = async (path: string) => {

    if (context.fileDependenciesToRestartOn!.indexOf(path) > -1) {

      if (typeof options.onDependencyToRestartOnChanged === 'function') {
        options.onDependencyToRestartOnChanged(path)
      }
      return
    }

    // list of .tsx page files to publish
    const pagesThatChanged: Array<string> = []

    Object.keys(context.fileDependencies!).forEach((dependencyPath: string) => {
      // some module imports doesn't come with a file extension and it's
      // good enough to not resolve those with expensive ops but just assume
      // we might need to rebuild stochastically valid dependencies

      if (path.startsWith(dependencyPath)) {
        context.fileDependencies![dependencyPath].forEach((pageFile) => {
          if (isPage(pageFile, context.config) && pagesThatChanged.indexOf(pageFile) === -1) {
            // invalidate the codeCache
            invalidateCache(pageFile, context)

            // adds the page file to the list page files
            // that changed as an (in)direct dependency of it
            pagesThatChanged.push(pageFile)
          }
        })
      }
    })

    // if the file changed is a page template file and not yet part of the list
    // of page templates to publish, then add
    if (
      path.endsWith('.tsx') &&
      isPage(path, context.config) &&
      pagesThatChanged.indexOf(path) === -1
    ) {
      pagesThatChanged.push(path)
    }

    if (typeof options.onPagesChanged === 'function') {
      options.onPagesChanged(pagesThatChanged)
    }
  }

  /** triggers file change handling, but debounced to we don't get too many re-transforms  */
  const handleFileChangeDebounced: (path: string) => void = debounce(handleFileChange, fileChangeDebounceMs)

  /** copies over public/** to dist/** on file change in public dir */
  const handlePublicDirFileOperationDebounced: (path: string) => void = debounce((path: string) => {
    if (path.startsWith(getPublicFolder(context.config))) {
      publishPublicFolder(context)
    }
  }, publicFolderChangeCopyDebounceMs /* ms, to prevent triggering the copy too many times */)

  // watch for file changes
  watch(`${projectDir}/**`).on('all', async (eventName: string, path: string) => {
    // public dir file operation happened, copy files to dist
    handlePublicDirFileOperationDebounced(path)

    // only watch out for changes and included directories
    if (eventName !== 'change' || isInExcludedFolder(path)) return

    handleFileChangeDebounced(path)
  })
}

/** adds a file dependency to the linked list */
export const addFileDependency = (filePath: string, context: Context, pagePath: string) => {
  if (!context.fileDependencies![filePath]) context.fileDependencies![filePath] = []

  if (context.fileDependencies![filePath].indexOf(pagePath) === -1) {
    // single filePath -> page template list
    context.fileDependencies![filePath].push(pagePath)
  }
}