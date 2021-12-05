import { Context } from '../../../@types/context'
import { HookFn } from '../hook'

export const genServiceWorker: HookFn = async (context: Context, props: any) => {
  //console.log('genServiceWorker', context, props)
  // TODO:
  // post-processing hook to generate a service-worker with sw.js
  // that includes a cache manifest to ensure none-hoisted resources are cached locally
  // generate based on context.resourceIndex (TODO)
}
