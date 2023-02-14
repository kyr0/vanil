import { resolve } from "path";
import { Context } from "./context";
import { ensureDir, getDistFolder, readFileContent, writeFileContent } from "./io";

export const storeFileNameDefault = '_store.json'

/** returns the absolute path to the _store.json file in dist folder */
export const getStoreFilePath = (context: Context) => resolve(getDistFolder(context.config), storeFileNameDefault)

/** tries to read the context.store, otherwise tries to read serialized context.store or returns an empty object */
export const getStore = async<S>(context: Context): Promise<S> => {
    if (context.store) return context.store as S
    try {
        return context.store = JSON.parse(await readFileContent(getStoreFilePath(context)))
    } catch (e) {
        const err = new Error("There is no store value. Neither in memory nor serialized to _store.json")
        err.stack = e.stack
        throw err
    }
}

/** writes the store value to context.store memory and serializes to _store.json in dist folder */
export const setStore = async<S>(value: S, context: Context): Promise<S> => {
    try {
        const _storeJsonPath = getStoreFilePath(context)
        await ensureDir(_storeJsonPath)
        await writeFileContent(_storeJsonPath, JSON.stringify(value))
    } catch(e) {
        const err = new Error("Cannot write to / serialize to _store.json")
        err.stack = e.stack
        throw err
    }
    context.store = value
    return value
}