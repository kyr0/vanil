import { execSync } from 'child_process'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
// run: ts-node scripts/release.ts

const projectRootDir = resolve(__dirname, '../')

// enforce execution of commands in project root dir
process.chdir(projectRootDir)

const prevPackageJSON = JSON.parse(readFileSync(resolve(projectRootDir, 'package.json'), { encoding: 'utf8' }))
const prevVersion = prevPackageJSON.version

const level = process.argv[2]

console.log(`Building next ${level} level version...`)

// build (throws exception on error and exits automatically)
execSync(`tsc`, { stdio: 'inherit' })

// bump version
execSync(`npm version ${level} --force`, { stdio: 'inherit' })

// read version generated
const packageJSON = JSON.parse(readFileSync(resolve(projectRootDir, 'package.json'), { encoding: 'utf8' }))

// ahead of time update vanil dependency in all examples
const examplesFolderPath = resolve(__dirname, '../examples')
const exampleFolders = readdirSync(examplesFolderPath)

console.log(`Updating examples ${exampleFolders} to version ${packageJSON.version} ahead-of-time...`)

exampleFolders.forEach((exampleFolder) => {
  const examplePackageJsonPath = resolve(examplesFolderPath, exampleFolder, 'package.json')
  const examplePackageJSON = JSON.parse(readFileSync(examplePackageJsonPath, { encoding: 'utf8' }))

  // update to upcoming released version ahead-of-time
  examplePackageJSON.dependencies['vanil'] = `^${packageJSON.version}`

  writeFileSync(examplePackageJsonPath, JSON.stringify(examplePackageJSON, null, 2), { encoding: 'utf8' })
})

console.log(`Version ${packageJSON.version} will be released now.`)

// git add; git commit; git push

const commitMsg = `chore: version bump ${level} ${packageJSON.version}`
try {
  execSync(`git add .`, { stdio: 'inherit' })
} catch (e) {}
try {
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' })
} catch (e) {}
try {
  execSync(`git push`, { stdio: 'inherit' })
} catch (e) {}

console.log(`Done git add, commit, push: ${commitMsg}`)

console.log(`Publishing to npm registry...`)
execSync(`npm publish`, { stdio: 'inherit' })
