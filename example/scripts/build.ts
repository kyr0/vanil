import { build, clean, createContext } from "../../dist/core"
import config from "../config"
import { prepareData } from "./prepareData"

const context = createContext({ config })

await clean(context)

await prepareData(context)

await build(context)

process.exit(0)