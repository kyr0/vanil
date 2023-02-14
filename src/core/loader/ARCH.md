# Ahead-of-time file loaders

The `loadFiles<T = string>(pathPattern: string): Promise<Array<T>>` and `loadFile<T = string>(pathPattern: string): Promise<T>` APIs allow for loading file(s) in `getStaticProps()`, `getStaticPaths()` and `getStaticServerProps()`.

Example: 
```ts
const binaryBlobFileContents: Array<Buffer> = 
    await loadFiles<Buffer>('raw:../assets/*.png', { encoding: 'binary' })`
```

After all paths have been resolved, an appropriate file loader is selected
by the file name extension automatically. To explicitly select a specific loader,
the loader prefix syntax can be used:

```ts
interface Translations {
    [key: string]: string
}
const allTranslations: Array<Translations> = 
    await loadFiles<Translations>('raw:../translations/*.json5')`
```

The following loaders and file extensions are mapped by default:

`.json5 => json5 | returns a JSON object`
`.json -> json | returns a JSON object`
`.?? -> raw | returns the plain-text file content, utf-8 encoded`

Loader prefixes are relevant for general-purpose file handling:

`raw | returns the contents of a file as text with utf-8 encoding`
`resolve | returns the resolved absolute file path to a file`

One another example:
```ts
const absolutePathToTheLogo = await loadFile('resolve:../../assets/logo.svg')
```

Please mind that an absolute path would usually only work on your machine.

## Architecture

All default loaders are implemented in this folder.

## Extensibility

You can add your own custom loaders after calling `createContext()` in your `build.ts`: 

```ts
import { readFile } from "fs/promises"
registerLoader({
    name: 'foo',
    match: /\.txt$/i, // optional, if not provided, will match nothing
    cb: (targetPath: string, options: { encoding: BufferEncoding }) : Promise<string> {
        return readFile(targetPath, { encoding })
    }
})
```