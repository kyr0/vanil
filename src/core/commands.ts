export enum Commands {
  HELP = "help",
  VERSION = "version",
  DEV = "dev",
  BUILD = "build",
  PREVIEW = "preview",
  CLEAN = "clean",
  CONFIG = "config",
}

export type Command =
  | "help"
  | "version"
  | "dev"
  | "build"
  | "preview"
  | "clean"
  | "config";
