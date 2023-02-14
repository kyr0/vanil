import { dev, clean, createContext, setStore } from "../../dist/core"
import config from "../config"
import { prepareData } from "./prepareData"

const context = createContext({ config })

await clean(context)

await prepareData(context)

await dev(context)