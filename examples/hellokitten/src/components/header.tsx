interface KittenHeaderProps {
    title: string
}

// TODO: test if we can import .astro components here

// SSG
export const KittenHeader = ({ title }: KittenHeaderProps) => (<h1>{ title }</h1>)