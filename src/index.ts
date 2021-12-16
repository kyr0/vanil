#!/usr/bin/env node
'use strict'

const child_process = require('child_process')
const path = require('path')
const yargs = require('yargs-parser')
const flags = yargs(process.argv)
const cmd = flags._[2]
const vanilRootDir = path.resolve(__dirname, '../../')

const getArgLine = () => [...process.argv].splice(2 /* remove the first two (node cmd, vanil bin) */).join(' ')

// CWD we're in atm will be chdir to package/module location dir
// when npm is called to run ts-node, therefore target directory
// argument needs to be resolved (only relevant for npx vanil init use-case)
if (cmd === 'init') {
  if (flags._[3]) {
    process.argv[3] = path.resolve(process.cwd(), flags._[3])
  } else {
    process.argv[3] = process.cwd()
  }
  child_process.execSync(`npm --prefix ${vanilRootDir} run start -- ${getArgLine()}`, { stdio: 'inherit' })
} else {
  const nodeModulesDir = path.resolve(__dirname, '../../../')
  const tsNodeBin = path.join(nodeModulesDir, '.bin', 'ts-node')
  const tsVanilBin = path.join(vanilRootDir, 'src', 'vanil.ts')

  child_process.execSync(`${tsNodeBin} ${tsVanilBin} ${getArgLine()}`, { stdio: 'inherit' })
}
