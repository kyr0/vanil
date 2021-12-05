export interface Store {
  [key: string]: any
}

export interface GetSetStorage extends Partial<Storage> {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type GetFn = (key: string, defaultValue?: any) => any
export type SetFn = (key: string, value: any) => StoreApi
export type LoadFn = (key: string, defaultValue?: any) => StoreApi
export type SaveFn = (key: string) => StoreApi
export type LoadForSessionFn = (key: string, defaultValue?: any) => StoreApi
export type SaveForSessionFn = (key: string) => StoreApi

export interface StoreApi {
  store: Store
  get: GetFn
  set: SetFn
  load: LoadFn
  save: SaveFn
  loadForSession: LoadForSessionFn
  saveForSession: SaveForSessionFn
}
