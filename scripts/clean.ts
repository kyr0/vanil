import { clean } from "../src/core";

// example call:
// yarn clean 
// OR:
// ts-node --esm --experimental-specifier-resolution=node ./scripts/clean.ts

/** removes the dist folder recursively  */
clean({ config: { dist: './dist' } })