import { IVirtualNode } from 'vanil'

export const setCubicVdomNodeSize = (size: number, node: IVirtualNode) => {
  const sizePx = `${size}px`
  node.attributes.width = sizePx
  node.attributes.height = sizePx
}
