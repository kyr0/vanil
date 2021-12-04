import shelljs from "shelljs"
import { Config } from "../@types/config"
import { getDistFolder } from "../core/io/folders"

/** removes the projects dist folder to clean the cache */
export const clean = (config: Config) => {

    console.log('Cleaning dist directory: ', getDistFolder(config))

    shelljs.rm('-rf', getDistFolder(config))

    return 0
}