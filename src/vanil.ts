#!/usr/bin/env node
'use strict'

import { resolve } from 'path'
import * as semver from 'semver'

/** `vanil $commandName` */
const main = async () => {
  const { cli } = await import('./cli/cli')

  try {
    cli(process.argv)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  const version = process.versions.node
  const { default: pkg } = await import(resolve(__dirname, '../package.json'))

  const engines = pkg.engines.node
  const isSupported = semver.satisfies(version, engines)

  if (!isSupported) {
    console.error(`\nNode.js v${version} is not supported by Vanil!
Please upgrade Node.js to a supported version: "${engines}"\n`)
    process.exit(1)
  }
}

main()
