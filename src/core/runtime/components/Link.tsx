export interface LinkProps {
    href: string
    rel?: string
}

/** component for <likn> injection that will prevent double-injection */
export const Link = (props: LinkProps) => {
    if (
        // runtime-interactive multi-load prevention
        (Vanil.isBrowser && !document.querySelector(`link[href="${props.href}"]`)) ||
        !Vanil.isBrowser // SSG mode, see tsx.ts for alternative multi-inject prevention
    ) {
        return <link rel="stylesheet" {...props} />
    }
    return <></>
}

Vanil.Link = Link