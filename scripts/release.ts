import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// run: ts-node scripts/release.ts

const projectRootDir = resolve(__dirname, '../')

// enforce execution of commands in project root dir
process.chdir(projectRootDir)

const level = process.argv[2]

console.log(`Building next ${level} level version...`)

// build (throws exception on error and exits automatically)
execSync(`tsc`, { stdio: 'inherit' })

// bump version
execSync(`npm version ${level} --force`, { stdio: 'inherit' })

// read version generated
const packageJSON = JSON.parse(readFileSync(resolve(projectRootDir, 'package.json'), { encoding: 'utf8' }))

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
