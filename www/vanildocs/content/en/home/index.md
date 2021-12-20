# Build exciting products with vanilla code!

It's _2022_ and modern web APIs reached 95%+ compatibility.
So... why are frameworks, bundlers and transpilers still a thing?

Why not assume that `JSX` is the better `HTML` and fuse it?
Why shouldn't we write `Node.js` and `Browser` code in one single file,
run the `Node.js` code server-side and inject the resulting state in
frontend `JSX` directly?

This way, working with components like in `React` just works, but
without any framework or VDOM. However, because `JSX` and `HTML`
standards are fused, and in the absence of any VDOM framework magic,
you could safely use `<script>` and run arbitrary JS code at runtime.

To make this concept lean and powerful, a nano `runtime` could be
conditionally and fragmentally injected, when used. The runtime would
optionally give us: `i18n`, `jsx` rendering, an `eventbus`, `$`-like
querying and a `store` API at the size of 0 to ~3000 byte.

We could have 1st class support for `.js|.jsx|.ts|.tsx|.css`, transpile
it in a readable way and get totally rid of source-maps. After all,
data formats like `.md|.json5|.json|.csv|.svg` could all be transformed in
a `JSX` VDOM and made available for programmatic change and rendering
both at server-side and in runtime (by automatically hydration SSG state).

Finally, we'd have only one compiler who orchestrates all this,
writes the resulting HTML and CSS code to disk, and depending on
if we're in `development` or `production` mode, `prettify` or `optimize`
the code.

You can run this all in any `CI/CD` and automatically upload the resulting
code to any hoster of choice. To boost performance to the max., the compiler comes with built-in hook API plugins, that build `sitemap.xml`, `robots.txt`, `manifest.json` and a `worker` for cache management. Thus, all static content would only 1x be loaded from the edge CDN of your hoster and is then cached in visitors browsers.

That is Vanil! A pragmatic compiler for the JAMStack era. Vanil helps you to enjoy simplicity, speed and elegance. Think Node.js React, Vue, jQuery, Svelte and Next.js at the same time. It has all the concepts, but no complexity.

<div class="d-flex flex-column flex-md-row">
    <a href="/en/docs/1_guides/A_getting-started" class="btn btn-lg btn-outline-primary mb-3">
    <Trans key="Try it out" ns="home" />
    </a>
    <a href="/docs/guides/concepts" class="btn btn-lg btn-bd-primary mb-3 me-md-3">
    Read more...
    </a>
</div>
