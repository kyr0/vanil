import { fetchContent, IVirtualNode } from "vanil"
import { setCubicVdomNodeSize } from "../../function/setCubicVdomNodeSize"

const vanilLogo: IVirtualNode = fetchContent('../../../public/assets/icons/vanil-logo.svg')[0]
vanilLogo.attributes.class = 'vanilLogo'
setCubicVdomNodeSize(35, vanilLogo)

export interface VanilLogoProps {
    className?: string
    width?: number
    height?: number
}

export const VanilLogo = ({className, width, height}: VanilLogoProps) => {

    if (className) {
        vanilLogo.attributes.class = `${vanilLogo.attributes.class} ${className}`
    }

    if (width) {
        vanilLogo.attributes.width = width
    }

    if (height) {
        vanilLogo.attributes.height = height
    }
    return vanilLogo
}