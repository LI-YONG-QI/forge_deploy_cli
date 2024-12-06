#!/usr/bin/env node

import util from "util";
import child_process from "child_process";

import { buildLibrary } from "./utils/parse";

const exec = util.promisify(child_process.exec);

async function main() {
  const path = await exec("pwd");

  const scriptFile = process.argv[2];
  const dev = process.argv[3] === "dev" ? true : false;

  if (dev) {
    await buildLibrary(path.stdout.replace("\n", "") + "/test", scriptFile);
  } else {
    await buildLibrary(path.stdout.replace("\n", ""), scriptFile);
  }
}

main();
