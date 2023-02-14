import { OnLoadArgs, OnLoadResult, Plugin } from "esbuild"
import { readFile } from "fs/promises";
import { SolidTransformOptions, transformSolidJsx } from "./transform-solid-jsx";

export const transformSgmlToSolid = async(source: string, path: string, options: SolidTransformOptions) => {
  // let's get rid of xml tag and doctype -- that's non parsable
  // in terms of support by JSX/TSX
  source = source.replace(/<\?xml [\s\S]*?\?>/, '')
  source = source.replace(/<!DOCTYPE[\s\S]*?>/, '')

  return await transformSolidJsx(`export default () => ${source}`, path, options)
}

export const solidSgmlLoader = (options: SolidTransformOptions) => async (args: OnLoadArgs): Promise<OnLoadResult> => {
  const source = await readFile(args.path, { encoding: "utf-8" })        
  return { contents: await transformSgmlToSolid(source, args.path, options), loader: "js" }
}

export function solidPlugin(options: SolidTransformOptions = {}): Plugin {
  return {
    name: "solid-jsx-transform",
    setup(build) {

      build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
        const source = await readFile(args.path, { encoding: "utf-8" })
        const code = await transformSolidJsx(source, args.path, options)
        return { contents: code, loader: "js" }
      })

      // support: import Foo from "bar.svg"
      // and rendering <Foo />
      build.onLoad({ filter: /\.svg$/ }, solidSgmlLoader(options))

      // support: import Foo from "bar.html"
      // and rendering <Foo />
      build.onLoad({ filter: /\.html?$/ }, solidSgmlLoader(options))
    },
  }
}