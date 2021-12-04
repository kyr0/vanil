// TODO: import such types from vanil
// TODO: provide standard components from vanil
// import { Props } from "vanil"

interface Props {
    children?: any
}

export const KittenLayout = ({ children }: Props) => {
    return (
        <div class="kittenLayout">
            {children}
        </div>
    )
}