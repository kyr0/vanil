import { Context } from "../context"
import { dirname, resolve, sep } from "path"
import { copyFiles, getDistFolder, getPagesFolder } from "../io"
import { addFileDependency } from "../change-detection"

/** copies the file in sourcePath to the dist folder or a sub directory. Returns a routable public path */
export const publishFile = (sourcePath: string, pagePath: string, context: Context, distSubDir?: string): string => {
    const currentPageDir = dirname(pagePath)
    const fileToCopy = resolve(currentPageDir, sourcePath)
    const currentSubDir = currentPageDir.replace(resolve(getPagesFolder(context.config)), '')

    if (typeof distSubDir === 'undefined') {
        distSubDir = currentSubDir
    }
    const distFolder = getDistFolder(context.config)
    const targetDir = resolve(distFolder, distSubDir)

    // a file that is published is most probably used by and therefore a dependency to the page
    addFileDependency(sourcePath, context, pagePath)

    return copyFiles(fileToCopy, targetDir).replace(`${distFolder}${sep}`, '')
}