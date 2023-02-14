#!/usr/bin/env node
"use strict";

import * as colors from "kleur/colors";
import yargs from "yargs-parser";
import { join, resolve } from "path";
import { dev } from "../command/dev";
import { build } from "../command/build";
//import { check } from '../task/check'
import { preview } from "../command/preview";
import { clean } from "../command/clean";
import { getFrameworkPackageJson, __dirnameESM } from "../io";
import {
  Config,
  configDefaults,
  isHookImplemented,
  readConfigFile,
  validateConfig,
} from "../config";
import { getExecutionMode } from "../mode";
import { existsSync } from "fs";
import { Command } from "../commands";

console.log("[VA] Node.js re-invoked with experimental flags.");

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught error!");
  console.error(error);
  process.exit(1);
});

export type Arguments = yargs.Arguments;

export interface CLIState {
  cmd: Command;
  options: {
    prod?: boolean;
    projectRoot?: string;
    site?: string;
    sitemap?: boolean;
    hostname?: string;
    port?: number;
    config?: string;
    dist?: string;
    useTls?: boolean;
    name?: string;
    tpl?: string;
  };
}

/** Determine which action the user requested */
export const resolveArgs = (flags: Arguments): CLIState => {
  const options: CLIState["options"] = {
    prod: typeof flags.prod === "boolean" ? flags.prod : undefined,
    projectRoot:
      typeof flags.projectRoot === "string" ? flags.projectRoot : undefined,
    site: typeof flags.site === "string" ? flags.site : undefined,
    sitemap: typeof flags.sitemap === "boolean" ? flags.sitemap : undefined,
    port: typeof flags.port === "number" ? flags.port : undefined,
    hostname: typeof flags.hostname === "string" ? flags.hostname : undefined,
    config: typeof flags.config === "string" ? flags.config : undefined,
    dist: typeof flags.dist === "string" ? flags.dist : undefined,
    useTls: typeof flags.useTls === "boolean" ? flags.useTls : undefined,
    name: typeof flags.name === "string" ? flags.name : undefined,
    tpl: typeof flags.tpl === "string" ? flags.tpl : undefined,
  };

  if (flags.version) {
    return { cmd: "version", options };
  } else if (flags.help) {
    return { cmd: "help", options };
  }

  const cmd: Command = flags._[2];
  switch (cmd) {
    case "dev":
      return { cmd: "dev", options };
    case "build":
      return { cmd: "build", options };
    case "preview":
      return { cmd: "preview", options };
    /*case 'check':
      return { cmd: 'check', options }*/
    case "config":
      return { cmd: "config", options };
    case "clean":
      return { cmd: "clean", options };
    default:
      return { cmd: "help", options };
  }
};

/** Display --help flag */
const printHelp = () => {
  console.error(`  ${colors.bold("Vanil")} - a solid site generator
  ${colors.bold("Commands:")}
  run dev             Run in development mode (live-reload).
  run build           Build a pre-compiled production version of your site.
  run preview         Preview your build locally before deploying.
  run config          Prints the final config and explains how to customize it.
  run clean           Removes the dist folder of your site; this cleans the cache.
  run init <dir>      Scaffolds a new project in <dir>.
  ${colors.bold("Flags:")}
  --prod                Run in production mode.
  --port <number>       Specify port to serve on (dev, preview only).
  --project-root <path> Specify the path to the project root folder, relative to CWD.
  --site <uri>          Specify site to use as site location.
  --use-tls             Enables https:// for all URIs.
  --dist                Specify the distribution folder (build result).
  --hostname <string>   Specify hostname to serve on (dev, preview only).
  --no-sitemap          Disable sitemap generation (build only).
  --version             Show the version number and exit.
  --help                Show this help message.
  ${colors.bold("For creating new projects (run init):")}
  --name <project-name> Name of the project (only useful with "init").
  --tpl <dir-or-repo>   Path to a template folder or git repository.
`);
};

/** display --version flag */
const printVersion = async () => {
  console.log((await getFrameworkPackageJson()).version);
};

/** print the final config and explains how to customize it */
const printConfig = (config: Config) => {
  console.log("");
  console.log("Configuration after validation:");
  console.log("");
  console.log(JSON.stringify(config, null, 2));
  console.log("");
  console.log("[!] You can customize the project configuration by ");
  console.log("creating a config.ts file like that:");
  console.log("that calls createConfig({ ... })");
};

/** merge CLI flags & config options (CLI flags take priority) */
export const applyCLIFlags = (config: Config, flags: CLIState["options"]) => {
  if (typeof flags.prod === "boolean") process.env.NODE_ENV = "production";

  if (typeof flags.dist === "string") config.dist = flags.dist;

  if (typeof flags.sitemap === "boolean")
    config.buildOptions!.sitemap = flags.sitemap;
  if (typeof flags.site === "string") config.buildOptions!.site = flags.site;

  if (typeof flags.port === "number") config.devOptions!.port = flags.port;
  if (typeof flags.hostname === "string")
    config.devOptions!.hostname = flags.hostname;
  if (typeof flags.useTls === "boolean")
    config.devOptions!.useTls = flags.useTls;
};

/** calls the default clean command implementation of a userland hook */
export const callCleanCommand = async (config: Config) => {
  if (isHookImplemented("clean", config)) {
    await config.hooks.onClean({ config });
  } else {
    await clean({ config });
  }
};

/** The primary CLI action */
export const cli = async (args: string[]) => {
  const flags = yargs(args);
  const state = resolveArgs(flags);
  const options = { ...state.options };
  const projectRootOverride = options.projectRoot || flags._[3];

  let userConfig: Config = {
    buildOptions: {},
    devOptions: {},
  };

  const defaultConfig = configDefaults;

  if (projectRootOverride) {
    // if a custom projectRoot was set by a flag like --project-root,
    // relatively resolve it to current process.cwd()
    // current cwd can be futher modified by using npm --prefix $dir $command
    defaultConfig.projectRoot = resolve(
      defaultConfig.projectRoot!,
      projectRootOverride
    );
  }

  const configFilePath = join(process.cwd(), "config.ts");

  if (existsSync(configFilePath)) {
    userConfig = await readConfigFile(configFilePath);
  }

  const config: Config = {
    // apply defaults
    ...defaultConfig,
    ...userConfig,
    // override by vanil config options set in package.json (maybe)
    buildOptions: {
      ...defaultConfig.buildOptions,
      ...userConfig.buildOptions,
    },
    devOptions: {
      ...defaultConfig.devOptions,
      ...userConfig.devOptions,
    },
  };

  try {
    // override config options by CLI parameters
    applyCLIFlags(config, options);

    // e.g. evaluate site from hostname + port if not set
    validateConfig(config);
  } catch (err) {
    console.error(colors.red((err as any).toString() || err));
    process.exit(1);
  }

  // reset console screen
  //console.clear()

  console.log(
    colors.dim(">"),
    `${colors.bold(colors.yellow("vanil"))} @ ${colors.dim(
      (await getFrameworkPackageJson()).version
    )}: ${colors.magenta(colors.bold(state.cmd))}`,
    colors.cyan(`(${getExecutionMode()})`),
    colors.gray("...")
  );

  switch (state.cmd) {
    case "help": {
      printHelp();
      process.exit(0);
    }
    case "version": {
      await printVersion();
      process.exit(0);
    }
    case "config": {
      printConfig(config);
      process.exit(0);
    }
    case "dev": {
      try {
        // always, by default, clean on dev restart (consistent builds)
        await callCleanCommand(config);

        if (isHookImplemented(state.cmd, config)) {
          await config.hooks.onDev({ config });
        } else {
          await dev({ config });
        }
      } catch (err) {
        printError(err);
      }
      return;
    }
    case "build": {
      try {
        // always, by default, clean on build restart (consistent builds)
        await callCleanCommand(config);

        if (isHookImplemented(state.cmd, config)) {
          await config.hooks.onBuild({ config });
        } else {
          await build({ config });
        }
        process.exit(0);
      } catch (err) {
        throwAndExit(err);
      }
      return;
    }
    case "preview": {
      try {
        if (isHookImplemented(state.cmd, config)) {
          await config.hooks.onPreview({ config });
        } else {
          await preview({ config });
        }
      } catch (err) {
        throwAndExit(err);
      }
      return;
    }
    case "clean": {
      try {
        await callCleanCommand(config);
      } catch (err) {
        throwAndExit(err);
      }
      process.exit(0);
    }
    default: {
      throw new Error(`Error running ${state.cmd}`);
    }
  }
};

const printError = (err: any) =>
  console.error(colors.red(err.toString() || err));

/** Display error and exit */
const throwAndExit = (err: any) => {
  printError(err);
  process.exit(1);
};

try {
  await cli(process.argv);
} catch (error) {
  console.error(error);
  process.exit(1);
}
