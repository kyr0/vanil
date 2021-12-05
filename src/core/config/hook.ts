import { HookRegistrations } from '../hook/hook'
import { Context } from '../../@types/context'

export const getDefaultHookConfig = (context: Context): HookRegistrations => {
  return {
    initialized: false,
    perStage: {
      onStart: [],
      onContext: [],
      onDevServerStart: [],
      onBeforePage: [],
      onAfterPage: [],
      onFinish: [],
    },
  }
}
