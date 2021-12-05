import { InteractiveRuntime } from './runtime'

declare global {
  interface Window {
    Vanil: InteractiveRuntime
  }
}
