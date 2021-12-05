import { GetSetStorage, StoreApi } from '../../@types/runtime/store'

Vanil.store = {}

export const getMockStorage = (): GetSetStorage => {
  return {
    getItem: (key: string) => Vanil.store[key],
    setItem: (key: string, value: any) => (Vanil.store[key] = value),
  }
}

export const getSessionStorage = () => {
  try {
    return sessionStorage
  } catch (e) {
    // can throw SecurityException
    return getMockStorage()
  }
}

export const getLocalStorage = () => {
  try {
    return localStorage
  } catch (e) {
    // can throw SecurityException
    return getMockStorage()
  }
}

export const persist = (key: string, api: GetSetStorage, store: StoreApi) => {
  api.setItem(key, JSON.stringify(store.store[key]))
  return store
}

export const restore = (key: string, store: StoreApi, api: GetSetStorage, defaultValue?: any) => {
  store.set(key, JSON.parse(api.getItem(key) || '""') || defaultValue)
}

Vanil.get = (key: string, defaultValue?: any) =>
  typeof Vanil.store[key] === 'undefined' ? defaultValue : Vanil.store[key]

Vanil.set = (key: string, value: any) => {
  Vanil.store[key] = value
  return Vanil
}

Vanil.load = (key: string, defaultValue?: any) => {
  restore(key, Vanil, getLocalStorage(), defaultValue)
  return Vanil
}

Vanil.save = (key: string) => persist(key, getLocalStorage(), Vanil)

Vanil.loadForSession = (key: string, defaultValue?: any) => {
  restore(key, Vanil, getSessionStorage(), defaultValue)
  return Vanil
}

Vanil.saveForSession = (key: string) => persist(key, getSessionStorage(), Vanil)
