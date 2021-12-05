import * as colors from 'kleur/colors'

export const concatErrors = (results: string[]): string => {
  let result = ''
  if (typeof results !== 'undefined') {
    results.forEach((error) => {
      result += `\n${colors.red(`  [!]  ${error}`)}`
    })
  }
  return result
}
