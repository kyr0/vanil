interface KittenHeaderProps {
    title: string
}

// SSG
export const KittenHeader = ({ title }: KittenHeaderProps) => (<h1>{ title }</h1>)