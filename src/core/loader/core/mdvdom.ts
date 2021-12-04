import { readFileSyncUtf8 } from "../../io/file"
import { Context } from "../../../@types/context"
import { transpileTSX } from "../../transform/transpile"
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from "../interface"
const marked = require("marked")

/** resolves a given target path to an absolute path on disk and returns its UTF8 contents */
export const mdVdomLoader: LoaderFn = (targetPath: string, context: Context) => {

    const mdHTML = marked.parse(readFileSyncUtf8(targetPath))

    // transpiles the SVG content as TSX to functional calls
    // and evaluates them down to a JSX JSON tree representation
    // that can be rendered at runtime
    return eval(transpileTSX(`<>${mdHTML}</>`, context))
}

export const registerMdVdomLoader: LoaderRegisterFn = (): LoaderRegistration => ({
    name: 'md-vdom',
    match: /\.md$/i,
    cb: mdVdomLoader
})