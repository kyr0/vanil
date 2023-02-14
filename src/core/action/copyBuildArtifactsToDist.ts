import { copyFiles, getDistFolder, glob, toProjectRootRelativePath } from '../io/folder'
import * as colors from 'kleur/colors'
import { Context } from '../context'
import { join, resolve, sep } from 'path'

/** copies files that match a specific pattern to their relative home (per file) in dist folder */
export const copyBuildArtifactsToDist = async (patterns: Array<string>, context: Context) => {

    for (let i=0; i<patterns.length; i++) {
        await copySingleBuildArtifactsToDist(patterns[i], context)
    }
}

const copySingleBuildArtifactsToDist = async (pattern: string, context: Context) => {

  const source = resolve(pattern)
  
  console.log(
    colors.bold(colors.dim('action (copyBuildArtifactsToDist):')),
    colors.gray(
      `Copying ${pattern} files from build artifacts to ${toProjectRootRelativePath(getDistFolder(context.config), context.config)} folder...`,
    ),
  )

  const filesToCopy = glob(source)
  const destsToCopyTo = filesToCopy.map(path => join(
        getDistFolder(context.config), 
        // prepend target dist path
        // remove temp dir path and turn into relative file path
        path.replace(`${context.tmpDir}${sep}`, '')
    ) 
  )

  for (let i=0; i<filesToCopy.length; i++) {
    copyFiles(filesToCopy[i], destsToCopyTo[i])
  }
}
