/** returns true if one of the predicate functions return true walking over a whole maps members */
export const oneOf = (map: object, predicate: (map: object, keyName: string) => boolean): boolean => {
  const keyNames = Object.keys(map)
  let oneOfTrue = false
  keyNames.forEach((keyName) => {
    if (predicate(map, keyName)) {
      oneOfTrue = true
    }
  })
  return oneOfTrue
}
