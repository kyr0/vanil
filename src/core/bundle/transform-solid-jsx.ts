import { transformAsync } from "@babel/core";
import solid from "babel-preset-solid";
import ts from "@babel/preset-typescript";
//import { parse } from "path";

export interface SolidTransformOptions {
  hydratable?: boolean;
  generate?: 'dom' | 'ssr';
}

/** transforms JS/TS code or other HTML/SVG syntax into Solid code */
export const transformSolidJsx = async(code: string, filePath: string, options: SolidTransformOptions): Promise<string> => {
    //const { name, ext } = parse(filePath);
    //const filename = name + ext;
    const { code: transformedCode } = await transformAsync(code, {
        presets: [[solid, options], ts],
        filename: filePath,
        sourceMaps: "inline",
    });
    return transformedCode
}