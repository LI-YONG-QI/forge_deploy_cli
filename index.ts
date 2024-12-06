#!/usr/bin/env node

import util from "util";
import child_process from "child_process";

import { generateDeployer } from "./utils/parse";

const exec = util.promisify(child_process.exec);

async function main() {
  const path = await exec("pwd");

  console.log(path.stdout);
  const scriptFile = process.argv[2];

  const dev = process.argv[3] === "dev" ? true : false;

  if (dev) {
    await generateDeployer(path.stdout.replace("\n", "") + "/test", scriptFile);
  } else {
    await generateDeployer(path.stdout.replace("\n", ""), scriptFile);
  }
}

main();
