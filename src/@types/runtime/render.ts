import { ElementRefs } from "../context/refs";
import { RenderFn } from "./vdom";

export interface RenderApi {
    
    tsx: (type: any, attributes: any, ...children: any) => any

    // runtime DOM refs
    refs: ElementRefs
    render: RenderFn
}
