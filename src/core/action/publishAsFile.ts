import { sep } from "path"
import { Context } from "../context"
import { Content, getDistFolder, toProjectRootRelativePath, writeFileToDistFolder } from "../io"

/** writes content to the relative file path subDirFilePath in dist folder and returns the relative path that resolves to it publicly and relatively via HTTP request */
export const publishAsFile = async(content: Content, subDirFilePath: string, context: Context, encoding: BufferEncoding = 'utf-8'): Promise<string> => {

    const distFolder = toProjectRootRelativePath(getDistFolder(context.config), context.config)  
    const projectRootRelativePath = await writeFileToDistFolder(subDirFilePath, content, context, encoding)

    return projectRootRelativePath.replace(`${distFolder}${sep}`, '')
}