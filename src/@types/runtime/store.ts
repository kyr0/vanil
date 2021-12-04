export interface Store { [key: string]: any }

export interface GetSetStorage extends Partial<Storage> {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}

export interface StoreApi {
  store: Store
  get(key: string, defaultValue?: any): any
  set(key: string, value: any): StoreApi
  load(key: string, defaultValue?: any): StoreApi
  save(key: string): StoreApi
  loadForSession(key: string, defaultValue?: any): StoreApi
  saveForSession(key: string): StoreApi
}