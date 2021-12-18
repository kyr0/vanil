import { fetchContent, IVirtualNode } from "vanil"

const toggle: IVirtualNode = fetchContent('../../../public/assets/icons/navbar-toggle.svg')[0]

export const NavbarToggle = () => toggle