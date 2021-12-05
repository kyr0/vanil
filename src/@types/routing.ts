export type DynamicParameterType = 'rest' | 'named'

export interface DynamicRoutingParameterMap {
  [parameterName: string]: DynamicParameterType
}

export interface PageParamsAndProps {
  params?: {
    [parameterName: string]: string
  }
  props?: {
    [propertyName: string]: string | number | boolean | null | object | Array<any>
  }
}

export interface PaginationParams {
  pageSize: number
}
