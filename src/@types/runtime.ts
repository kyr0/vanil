import { Context } from "./context";
import { PageParamsAndProps } from "./routing";
import { i18nApi } from "./runtime/i18n";
import { StoreApi } from "./runtime/store";
import { IVirtualChild, VDomApi } from "./runtime/vdom";

import { Debug } from "../core/runtime/components/Debug"
import { Script } from "../core/runtime/components/Script"
import { Link } from "../core/runtime/components/Link"
import { Code } from "../core/runtime/components/Code"
import { Trans } from "../core/runtime/components/Trans"
import { EventApi } from "./runtime/event";
import { RenderApi } from "./runtime/render";
import { BusApi } from "./runtime/bus";
import { QueryApi } from "./runtime/query";

export interface SSGRuntime extends StoreApi, i18nApi {

    mode: 'development' | 'production'

    slots: {
        [slotName: string]: IVirtualChild
    }
    request: {
        url: string
    } & PageParamsAndProps,      
    props: {
        context: Context
        state: any
        [propName: string]: any
    },
    resolve: (filePath: string) => string
    fetchContent: (fileGlob: string) => Array<any>
    isPage: boolean
    isBrowser: boolean
    site: string

    // isomorphic components
    Debug: typeof Debug
    Script: typeof Script
    Link: typeof Link
    Code: typeof Code
    Trans: typeof Trans
}

export interface InteractiveRuntime extends SSGRuntime, BusApi, QueryApi, EventApi, VDomApi, RenderApi {    

    /** 
     * checks the exports type (called with typeof exports) and 
     * returns an empty object or the exisiting one in scope 
     */
    exports: (exportsType: string) => { [exportName: string]: any }
}

// export defaults
export default InteractiveRuntime