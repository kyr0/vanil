#!/usr/bin/env node
'use strict'

import { resolve } from 'path/posix'

const child_process = require('child_process')
const path = require('path')

const yargs = require('yargs-parser')
const flags = yargs(process.argv)
const cmd = flags._[2]

if (cmd === 'init') {
  console.log('init -> cwd path empty, defaulting to', process.cwd())

  if (flags._[3]) {
    path.resolve(process.cwd(), flags._[3])
  } else {
    flags._[3] = process.cwd()
  }
}

const argLine = [...process.argv].splice(2 /* remove the first two (node cmd, vanil bin) */).join(' ')

// const nodeModulesDir = path.resolve(__dirname, '../../../')
const vanilRootDir = path.resolve(__dirname, '../../')

// const tsNodeBin = path.join(nodeModulesDir, '.bin', 'ts-node')
// const tsVanilBin = path.join(vanilRootDir, 'src', 'vanil.ts')

child_process.execSync(`npm --prefix ${vanilRootDir} run start -- ${argLine}`, { stdio: 'inherit' })
