import { fetchContent } from "vanil"

import { setCubicVdomNodeSize } from "../../function/setCubicVdomNodeSize"

const vanilLogo = fetchContent('../../../public/assets/vanil-logo.svg')[0]
vanilLogo.attributes.class = 'vanilLogo'
setCubicVdomNodeSize(35, vanilLogo)

export const VanilLogo = () => vanilLogo