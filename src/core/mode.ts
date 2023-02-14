export enum Modes {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export type Mode = 'development' | 'production'

export const getExecutionMode = (): Mode => (process.env.NODE_ENV || 'development') as Mode