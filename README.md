# VANIL

[![Join the chat at https://gitter.im/vanil-build/community](https://badges.gitter.im/vanil-build/community.svg)](https://gitter.im/vanil-build/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Vanilla JSX + HTML + CSS compiler and static-site generator (SSG)

VANIL is a compiler and static site generator (SSG) that combines TSX/JSX+HTML+CSS and modern web standards. Back in the day, _transpilers_, _bundlers_, _source maps_ and _frameworks_ have been invented to cope with web-tech limitations. However,
the ancient times are over. It's time to get rid of all the complexity,  
and get back to the roots and use vanilla APIs - modern vanilla code is lightweight,
powerful, vastly compatible and very maintainable. The missing part has been
the glue layer in between: VANIL.

VANIL uses the Astro.build template format, but it's rather meant for the land-bornes among us. This is not a fork, it's a clean-room re-implementation that
pragmatically implements the original API, but extends it with a dynamic runtime.

And, no pun intended, already [more stable than the original](https://github.com/snowpackjs/astro/issues/1787). At least, it doesn't fall apart when you use template literals ;)

## Example

See [`examples/hellokitten`](examples/hellokitten)

## IDE Support

There is experimental support for `.astro`, `.scss` in `<style>` and `.json5`.

Please install the following extensions:

- `.astro` file format support: [Vanil Extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- auto-complete in `<script>` tags: TODO https://github.com/microsoft/vscode/pull/121517
- then disable `@builtin HTML Language Features` as these collide with the fixed ones (see extension above)
- [SCSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-scss)
- [SCSS Style Tag](https://marketplace.visualstudio.com/items?itemName=sissel.scss-style-tag)
- [JSON5](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-json5)

## How does it work?

In the modern world of frontend engineering, it seems like we have to accept complexity as given. However, according to caniuse, we can deploy modern JS, CSS language features and reach >95% market share now.

Thinking critically, we'll find that TSX components need no frameworks to work.
Any transpiler would turn them into a JSON tree, functionally describing a DOM structure. It takes only a trivial `render()` function and a real or mocked DOM API to construct a DOM tree.

This is exactly what happens in Vanil:

- on the server side, TSX is turned into a virtual DOM tree which is then, using a tree transform operation, turned into an HTML string
- however, the same TSX written in a `<script>` tag is transpiled to a functional representation and rendered as a DOM tree fragment at runtime

Using a small runtime library that is inspired by jQuery, component or page code can mutate the real DOM with those fragments explicitly -- there is no need for any framework to use the power of component-oriented frontend-engineering.

Same for CSS-in-JS solutions: In Vanil, it's perfectly valid to write CSS code or SCSS code in `<style>` tags or load a stylesheet via `<link />`. The `lang` attribute indicates the language dialect (e.g. `scss`). Evaluating the `<style>` content as a
JavaScript template string in the exact same SSG Node.js execution context allows
direct templating of CSS in JS. Post-processing with PostCSS leverages all benefits
of auto-prefixing, and CSS selector nesting.

Again, there is no need for any framework or complex tooling.

Finally, some code generators and filesystem automation, including hooks allow
full control over the very internals of the Vanil compiler. Even the configuration
of the transpilation can be directly mutated, using e.g. the `onContext` hook.
Implementing one simple function is enough -- no complex setup.

Most configuration can be directly managed in the project `package.json`s `vanil`
object.

Here are a few ideas on how it feels to work with Vanil:

- each page you want to have is saved as `$pageName.astro`
- you fetch the initial state data via Node.js `fetch()` on top of that file
- you write your initial TSX+HTML+CSS code below
- for interactive code to be run in the browser, use `<script>` (and this code also supports import, require and any module format)
- the interactive code has a tiny runtime lib to use TSX at runtime in-browser
- to define your pages routes, you just create folders and files with dynamic names: `pages/index.astro`, `pages/blog/[blogPostSlug].astro`, etc.
- of course you can use TSX functional components in an isomorphic way - like in React
- the Vanil compiler will render all HTML files to `dist/**/*.html`
- the hot-module-reload (HMR) devServer brings in perfect developer experience
- there is a preview HTTP server to preview the results
- the config and hooks API allows to customize every compiler-internal config
- file loaders allow to load and parse any file format (maybe via your own custom loaders)
- Vanil is super-fast and light on resources
- Vanil optimizes for code readability in `development` and file size in `production`
- language level is automatically adapted based on `browserslist` confing in your `package.json`
- finally, standard hooks generate `sitemap.xml`, `robots.txt`, (TODO) `serviceWorker.js`, (TODO) `manifest.json` according to the config

## Near-term roadmap (till beta release)

- feat: throw error when fetchContent or resolve is used in .ts or .tsx code included by .astro components or hooks
- build docs website with Vanil; publish to netlify
- build homepage website with Vanil; publish to vercel
- publish examples to github pages
- basic unit tests
- basic integration tests

## Mid-term roadmap

- feat: implement a codeguide https://codeguide.co/#css-import
- perf: imagemin hook https://github.com/imagemin/imagemin + https://www.npmjs.com/package/imagemin-svgo
- perf: CLI: run it all using transpiled code, not with ts-node
- perf: use context.paths.\* instead of getter functions
- feat: npm vanil init hook
- refactor: rewrite import split parser (support multi-line dynamic / sync imports)
- perf: linkedom can be probably constructed directly in tsx()
- perf: better codeCache with fileOrigin map, FNV hash algo and bloom filter, also cross-page/component cases
- perf: generator for `serviceWorker.js` and caching using FNV hash algo and bloom filter
- feat: generator for `manifest.json`
- test: 100% test coverage; currently: 0%
- feat: Pagination support for `getStaticPaths`
- feat: auto-schema-generating GraphQL client and on-the-fly OpenAPI client API generator / client
- perf: use `cluster` for build parallelization
- security: `vm2` secure mode support
- feat: `download` attribute on all elements with href and src to download files to dist dir and use the dist target path as `src`
- feat: `check` to implement `webhint` / https://webhint.io/docs/user-guide/hints/hint-typescript-config/target/#what-does-the-hint-check
