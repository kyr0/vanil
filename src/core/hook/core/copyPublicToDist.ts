import { copyFiles, getDistFolder, getPublicFolder } from "../../io/folders"
import { Context } from "../../../@types/context"
import { HookFn } from "../hook"

/** copy files and directories recursively from public to dist */
export const copyPublicToDist: HookFn = async(context: Context) => {

    console.log('[hook:copyPublicToDist] Copying public/**/* files to dist folder...')

    const publicFolder = getPublicFolder(context.config)
    const distFolder = getDistFolder(context.config)

    copyFiles(publicFolder, distFolder)
}