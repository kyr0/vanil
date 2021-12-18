import { fetchContent, IVirtualNode, set, get } from "vanil"
import { setCubicVdomNodeSize } from "../../function/setCubicVdomNodeSize"

const gitterLogo: IVirtualNode = fetchContent('../../../public/assets/icons/gitter-logo.svg')[0]
setCubicVdomNodeSize(30, gitterLogo)

export const GitterLogo = () => gitterLogo