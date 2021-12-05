import * as colors from 'kleur/colors'

export const printFooter = (documentationUrl: string, projectPath: string, issueUrl: string) => {
  console.log('')
  console.log(colors.green('Thank you for using VANIL!'))
  console.log('')
  console.log('If you are unfamiliar with Vanil, please head on to: 👩‍💻👨‍💻')
  console.log(`${colors.green(documentationUrl)}`)
  console.log('')
  console.log("We hope you'll have the same fun using it as we had creating it! 🤩")
  console.log()
  console.log("But in case this isn't the case, if you find Vanil is counter-intuitive or buggy atm 🧐, ")
  console.log('please file an issue 💩 so we can improve asap:')
  console.log(`${colors.green(issueUrl)}`)
  console.log()
  console.log(colors.yellow('🚀 We are highly motivated to deliver a *stellar* developer experience! 🚀'))
  console.log()
  console.log('The project directory is:')
  console.log('')
  console.log(`    ${colors.green(`cd ${projectPath}`)}`)
  console.log('')
}
