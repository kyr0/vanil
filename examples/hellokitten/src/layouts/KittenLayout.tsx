// TODO: import such types from vanil
// TODO: provide standard components from vanil
// import { Props } from "vanil"

// TODO: PropsWithChildren case
export interface KittenLayoutProps {
    foo: string
    children?: any
}

export const KittenLayout = (props: KittenLayoutProps) => {

    console.log('KittenLayout props', props)
    return (
        <div class="kittenLayout">
            {props.children}
        </div>
    )
}