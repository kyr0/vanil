#!/usr/bin/env node
"use strict";

import * as colors from "kleur/colors";
import { execSync } from "child_process";
import { getArgLine } from "../process";
import { getFrameworkPackageJson, __dirnameESM } from "../io";
import { join } from "path";
import { satisfies } from "semver";

console.log("[VA] Node.js started.");

/** prints an error and crashes with an exit code 1 in case Node.js version isn't copatible */
export const checkEngineVersionAndCrash = async () => {
  const version = process.versions.node;
  const engines = (await getFrameworkPackageJson()).engines.node;
  const isSupported = satisfies(version, engines);

  if (!isSupported) {
    console.error(
      colors.bgRed(`\nNode.js v${version} is not supported by Vanil!
      Please upgrade Node.js to a supported version: "${engines}"\n`)
    );
    process.exit(1);
  }
};
await checkEngineVersionAndCrash();

process.env.NODE_OPTIONS = `--inspect --enable-source-maps --experimental-vm-modules --experimental-import-meta-resolve --experimental-specifier-resolution=node --no-warnings`;

const nodeExecutablePath = process.argv[0];
const argLine = getArgLine();
const modernRunnerScript = join(__dirnameESM(), "run-command.js");

// calling the command executor script with the resolved node binary
execSync(`${nodeExecutablePath} ${modernRunnerScript} ${argLine}`, {
  stdio: "inherit",
  env: { ...process.env },
});
