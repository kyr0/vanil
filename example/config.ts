import { build, dev, Context, createConfig } from "../dist/core";

export default createConfig({
    hooks: {
        onBuild: async(partialContext: Partial<Context>) => {
            console.log('before')
            await build(partialContext)
            console.log('after')
        },
        
        onDev: async(partialContext: Partial<Context>) => {
            console.log('before')
            await dev(partialContext)
            console.log('after')
        }
    }
})