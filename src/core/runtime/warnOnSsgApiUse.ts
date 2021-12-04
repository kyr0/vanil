/** throws an error with panic report explaining how to implement the logic wanted */
Vanil.fetchContent = (fileGlob: string) => {
    throw new Error(
`Cannot Vanil.fetchContent('${fileGlob}') at runtime (in browser). Please do: 
Vanil.props.setState({
    files: await Vanil.fetchContent('${fileGlob}')
}) 
in the SSG code (above the ---), and use Vanil.props.state.files at runtime!`)
}

/** throws an error with panic report explaining how to implement the logic wanted */
Vanil.resolve = (fileGlob: string) => {
    throw new Error(
`Cannot Vanil.resolve('${fileGlob}') at runtime (in browser). Please do: 
Vanil.props.setState({
    paths: await Vanil.resolve('${fileGlob}')
}) 
in the SSG code (above the ---), and use Vanil.props.state.paths at runtime!`)
}