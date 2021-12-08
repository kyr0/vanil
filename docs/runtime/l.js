
(async() => {// create shallow object
Vanil = Astro = {
    props: {},
};
Vanil.isBrowser = typeof window !== 'undefined';
// initializes the CJS exports object if necessary
// intentionally allows for global exports objects shared between <script>s
// (unified window-local exports scope)
exports = typeof exports === 'undefined' ? (exports = {}) : exports;
Vanil.mode = 'development';
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
                if (location.pathname === '/' && (eventData.path === '/index.html' || eventData.path === '/index')) {
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
