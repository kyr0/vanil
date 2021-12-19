/** throws an error with panic report explaining how to implement the logic wanted */
Vanil.fetchContent = (fileGlob: string) => {
  throw new Error(
    `Cannot fetchContent('${fileGlob}') at runtime (in browser). Please do: 
setPropsState({
    files: await fetchContent('${fileGlob}')
}) 
in the SSG code (above the ---), and use props.state.files at runtime!`,
  )
}

/** throws an error with panic report explaining how to implement the logic wanted */
Vanil.resolve = (fileGlob: string) => {
  throw new Error(
    `Cannot resolve('${fileGlob}') at runtime (in browser). Please do: 
setPropsState({
    paths: await resolve('${fileGlob}')
}) 
in the SSG code (above the ---), and use props.state.paths at runtime!`,
  )
}
