/** returns the program arguments, skips the caller and program name */
export const getArgLine = () => [...process.argv].splice(2 /* remove the first two (node cmd, vanil bin) */).join(' ')
