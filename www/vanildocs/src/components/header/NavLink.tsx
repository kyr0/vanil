import { NavSectionType } from "../../function/setNavSectionActive";
import { props } from "vanil"
import { toLangLink } from "../../function/toLocalizedLink";

export interface NavLinkProps {
    section: NavSectionType
    href: string
    title: string
}

export const NavLink = ({ title, href, section}: NavLinkProps) => (
    <a class={`nav-link p-2 ${props.navSectionActive === section ? 'active' : ''}`} href={toLangLink(href)}>
        { title }
    </a>
)