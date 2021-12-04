# Ahead-of-time file loaders

Vanil comes with a smart `Vanil.fetchContent(pathGlob: string)` API that
allows you to load file(s) in the SSG runtime code part of your Vanil
template file. 

After Vanil resolved the path glob pattern given, it checks if there is any 
file extension matcher matching and mapping to a loader function to load 
and sometimes parse and transpile/transform the file.

Developers using the API can also opt-in to specific loaders by prefixing `pathGlob` with the common-sense standard syntax `$loaderName!$pathGlob`,
for example:

`const allTextFiles = Vanil.fetchContent('raw:../assets/*.txt')`

Vanil defaults to use the `raw` loader for unknown file extensions.

The following loaders and file extensions are mapped by default:

`.json5 => json5 | returns a JSON object`
`.json -> json | returns a JSON object`
`.svg -> svg-tsx | returns a JSON JSX object (VDOM) you can render in TSX+HTML`
`.?? -> raw | returns the plain-text file content`

Two more loaders are relevant for general-purpose file handling:

`resolve | returns the resolved absolute file path to a file`

One another example: 
`const absPathToLogo = Vanil.fetchContent('resolve:../../assets/logo.svg')`

Please mind that an absolute path would usually only work on your machine.
Vanil is smart enough to hoist those files by copying them over to your 
public assets directory in case you're doing things like that: 

`<img src={absPathToLogo} />`

In this folder, all internal loaders are implemented. 
The hoising code can be found in `core/transform/tsx.ts`