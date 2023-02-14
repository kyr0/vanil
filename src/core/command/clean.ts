import { removeRecursiveForce } from "../io/folder";
import { resolve } from "path";
import * as colors from 'kleur/colors'
import { Context, validateContext } from "../context";

/** removes the projects dist folder to clean the cache */
export const clean = async(partialContext: Partial<Context>) => {
    const context = validateContext({
        ...partialContext,
        command: 'clean'
    })
    const pathToClean = resolve(process.cwd(), context.config.dist)

    console.log(
        colors.bold(colors.dim('task (clean):')),
        colors.gray(
            `Removing ${colors.green(context.config.dist)}...`,
        ),
    )
    return removeRecursiveForce(pathToClean)
}