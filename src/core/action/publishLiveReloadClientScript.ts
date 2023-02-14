import { copyFiles, getDistFolder, __dirnameESM } from "../io";
import { join, resolve } from "path";
import { Context } from "../context";

/** copies the live-reload.js and live-reload.js.map files to the dist folder */
export const publishLiveReloadClientScript = (context: Context) => {
    const liveReloadScriptBasePath = resolve(__dirnameESM(), 'runtime-client', '__live-reload')
    copyFiles(`${liveReloadScriptBasePath}.js`, join(getDistFolder(context.config), 'js', '__live-reload.js'))
    copyFiles(`${liveReloadScriptBasePath}.js.map`, join(getDistFolder(context.config), 'js', '__live-reload.js.map'))
}