
(async() => {
// create shallow object
Vanil = Astro = {
    fetch,
    props: {},
};
Vanil.isBrowser = typeof window !== 'undefined';
// initializes the CJS exports object if necessary
// intentionally allows for global exports objects shared between <script>s
// (unified window-local exports scope)
exports = typeof exports === 'undefined' ? (exports = {}) : exports;
Vanil.mode = 'development';
/** turns into: {}, which is detected here */
// @ts-ignore
const isJSXComment = (node) => node && typeof node === 'object' && !node.attributes && !node.type && !node.children;
/** filters comments and undefines like: ['a', 'b', false, {}] to: ['a', 'b', false] */
// @ts-ignore
const filterComments = (children) => children.filter((child) => !isJSXComment(child));
/** generates code to attach name-assigned events to the Vanil.event runtime */
// @ts-ignore
const runtimeAttachEventHandlers = (attributes) => {
    Object.keys(attributes).forEach((arributeName) => {
        if (!arributeName)
            return;
        if (!arributeName.startsWith('on'))
            return;
        // generating runtime interactive code to assign each event handler
        // registered a wrapper handler function for loosely/late binding
        attributes[arributeName] = `((e) => Vanil.e('${attributes[arributeName]}', e))(arguments[0])`;
    });
};
/**
 * tsx(React-like fn call structure) transform function
 * to return a JSON tree for actual DOM creation and string transformation
 * BEWARE: This code will be called by ts-node on imports and as well in inline transpile runs
 */
Vanil.tsx = (type, attributes, ...children) => {
    children = filterComments(
    // implementation to flatten virtual node children structures like:
    // [<p>1</p>, [<p>2</p>,<p>3</p>]] to: [<p>1</p>,<p>2</p>,<p>3</p>]
    [].concat.apply([], children));
    // clone attributes as well
    attributes = { ...attributes };
    // React fragment where type is { }
    if (typeof type === 'object') {
        children = type.children;
        type = 'fragment';
    }
    // support <></>
    if (typeof type === 'undefined') {
        type = 'fragment';
    }
    // effectively unwrap by directly returning the children
    if (type === 'fragment') {
        return filterComments(children);
    }
    // attach event handlers via Vanil.event runtime
    runtimeAttachEventHandlers(attributes);
    // it's a component;
    // call it to continue with tree transformation
    if (typeof type === 'function') {
        return type({
            children,
            ...attributes,
        });
    }
    return {
        type,
        attributes,
        children,
    };
};
// BEWARE: ISOMORPHIC IMPLEMENTATION :: ALSO USED IN SSG TRANSFORM STEP
const CLASS_ATTRIBUTE_NAME = 'class';
const XLINK_ATTRIBUTE_NAME = 'xlink';
const REF_ATTRIBUTE_NAME = 'ref';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const getAbstractDOM = (document, context) => {
    // DOM abstraction layer for manipulation
    const AbstractDOM = {
        hasElNamespace: (domElement) => domElement.namespaceURI === SVG_NAMESPACE,
        hasSvgNamespace: (parentElement, type) => AbstractDOM.hasElNamespace(parentElement) && type !== 'STYLE' && type !== 'SCRIPT',
        createElementOrElements: (virtualNode, parentDomElement) => {
            if (Array.isArray(virtualNode)) {
                return AbstractDOM.createChildElements(virtualNode, parentDomElement);
            }
            if (typeof virtualNode !== 'undefined') {
                return AbstractDOM.createElement(virtualNode, parentDomElement);
            }
            // undefined virtualNode -> e.g. when a tsx variable is used in markup which is undefined
            return AbstractDOM.createTextNode('', parentDomElement);
        },
        createElement: (virtualNode, parentDomElement) => {
            let newEl;
            if (virtualNode.type.toUpperCase() === 'SVG' ||
                (parentDomElement && AbstractDOM.hasSvgNamespace(parentDomElement, virtualNode.type.toUpperCase()))) {
                newEl = document.createElementNS(SVG_NAMESPACE, virtualNode.type, {});
            }
            else {
                newEl = document.createElement(virtualNode.type);
            }
            // istanbul ignore else
            if (virtualNode.attributes) {
                AbstractDOM.setAttributes(virtualNode.attributes, newEl);
            }
            // istanbul ignore else
            if (virtualNode.children) {
                AbstractDOM.createChildElements(virtualNode.children, newEl);
            }
            // istanbul ignore else
            if (parentDomElement) {
                parentDomElement.appendChild(newEl);
            }
            return newEl;
        },
        createTextNode: (text, domElement) => {
            const node = document.createTextNode(text.toString());
            // istanbul ignore else
            if (domElement) {
                domElement.appendChild(node);
            }
            return node;
        },
        createChildElements: (virtualChildren, domElement) => {
            const children = [];
            for (let i = 0; i < virtualChildren.length; i++) {
                const virtualChild = virtualChildren[i];
                if (virtualChild === null || (typeof virtualChild !== 'object' && typeof virtualChild !== 'function')) {
                    children.push(AbstractDOM.createTextNode((typeof virtualChild === 'undefined' || virtualChild === null ? '' : virtualChild).toString(), domElement));
                }
                else {
                    children.push(AbstractDOM.createElement(virtualChild, domElement));
                }
            }
            return children;
        },
        setAttribute: (name, value, domElement) => {
            // attributes not set (undefined) are ignored; use null value to reset an attributes state
            if (typeof value === 'undefined')
                return;
            // to reference elements by name and map the to Vanil.refs['$refName']
            if (name === REF_ATTRIBUTE_NAME && typeof value !== 'function') {
                if (typeof window === 'undefined') {
                    // SSG generates the DOM selector query, runtime assigns reference
                    context.refs[value] = `${domElement.tagName}[${REF_ATTRIBUTE_NAME}=${value}]`;
                }
                else {
                    Vanil.refs[value] = domElement;
                }
            }
            // support simple innerHTML set via attribute
            if (name === 'innerHTML') {
                domElement.innerHTML = value;
                return;
            }
            // support React variant for setting innerHTML
            if (name === 'dangerouslySetInnerHTML') {
                domElement.innerHTML = value.__html;
                return;
            }
            // support React htmlFor/for
            if (name === 'htmlFor') {
                name = 'for';
            }
            // transforms className="..." -> class="..."
            // allows for React TSX to work seamlessly
            if (name === 'className') {
                name = CLASS_ATTRIBUTE_NAME;
            }
            // transforms class={['a', 'b']} into class="a b"
            if (name === CLASS_ATTRIBUTE_NAME && Array.isArray(value)) {
                value = value.join(' ');
            }
            if (AbstractDOM.hasElNamespace(domElement) && name.startsWith(XLINK_ATTRIBUTE_NAME)) {
                // allows for <svg><use xlinkHref ...></svg>
                domElement.setAttributeNS('http://www.w3.org/1999/xlink', `${XLINK_ATTRIBUTE_NAME}:${name.replace(XLINK_ATTRIBUTE_NAME, '')}`.toLowerCase(), value);
            }
            else if (name === 'style' && typeof value !== 'string') {
                const propNames = Object.keys(value);
                for (let i = 0; i < propNames.length; i++) {
                    ;
                    domElement.style[propNames[i]] = value[propNames[i]];
                }
            }
            else if (typeof value === 'boolean') {
                // for cases like <button checked={false} />
                ;
                domElement[name] = value;
            }
            else {
                // for any other case
                domElement.setAttribute(name, value);
            }
        },
        setAttributes: (attributes, domElement) => {
            const attrNames = Object.keys(attributes);
            for (let i = 0; i < attrNames.length; i++) {
                AbstractDOM.setAttribute(attrNames[i], attributes[attrNames[i]], domElement);
            }
        },
    };
    return function (virtualNode, parentDomElement) {
        if (typeof virtualNode === 'string') {
            return AbstractDOM.createTextNode(virtualNode, parentDomElement);
        }
        return AbstractDOM.createElementOrElements(virtualNode, parentDomElement);
    };
};
exports.getAbstractDOM = getAbstractDOM;
// browser runtime-interactive render function assignment
if (typeof Vanil !== 'undefined' && typeof document !== 'undefined') {
    Vanil.render = (0, exports.getAbstractDOM)(document, Vanil.props.context);
}
__VANIL_LIVE_RELOAD_URL = "ws://localhost:3000/livereload";
// BEWARE: This file is only baked in, when mode === `development`
const connect = () => {
    console.log(`[hmr] trying to (re-)connect to: ${__VANIL_LIVE_RELOAD_URL}...`);
    const liveReloadSocket = new WebSocket(__VANIL_LIVE_RELOAD_URL);
    liveReloadSocket.onmessage = (event) => {
        const eventData = JSON.parse(event.data);
        if (eventData.operation === 'transform') {
            eventData.paths.forEach((path) => {
                let pathMatch = location.pathname === path;
                console.log('HMR location.pathname', location.pathname, 'vs', path);
                if (location.pathname.endsWith('/') && (eventData.path === '/index.html' || eventData.path === '/index')) {
                    pathMatch = true;
                }
                if (!eventData.path || pathMatch) {
                    document.location.reload();
                }
            });
        }
    };
    liveReloadSocket.onclose = () => {
        setTimeout(connect, 1000);
    };
};
connect();
})()
