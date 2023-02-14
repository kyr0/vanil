This package distributes the TypeScript sources with the npm package.
Therefore, the core/pages code is delivered to userland "as is".
The page templates here are not bundled/transpiled when published,
they are bundles/transpiled in userland/at runtime.

They should never be included in a bundle.