import { Context, setStore } from "../../dist/core"

export interface MyData {
    foo: string
}

export const prepareData = async(context: Context) => {

    setStore<MyData>({
        foo: "bar"
    }, context)
}