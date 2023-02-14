import { isExistingDir } from "./io";
import { dirname, resolve } from "path";

/** resolves a path relative to the basePath provided */
export const resolvePath = (path: string, basePath: string) =>
  resolve(isExistingDir(basePath) ? basePath : dirname(basePath), path)
