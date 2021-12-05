#!/usr/bin/env node
'use strict'
const child_process = require('child_process')
const path = require('path')

const argLine = [...process.argv].splice(2 /* remove the first two (node cmd, vanil bin) */).join(' ')

const nodeModulesDir = path.resolve(__dirname, '../../../')
const vanilRootDir = path.resolve(__dirname, '../../')
const tsNodeBin = path.join(nodeModulesDir, '.bin', 'ts-node')
const tsVanilBin = path.join(vanilRootDir, 'src', 'vanil.ts')

child_process.execSync(`${tsNodeBin} ${tsVanilBin} ${argLine}`, { stdio: 'inherit' })
