import { Context } from "vanil"

export const onStart = async(context: Context) => {
    console.log('project onStart hook called')

    if (context.expressApp) {
        context.expressApp.use(() => {
            console.log('project hook: devServer request intercept onStart')
        })
    }
}