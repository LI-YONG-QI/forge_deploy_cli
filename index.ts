#!/usr/bin/env node

import util from "util";
import child_process from "child_process";
const exec = util.promisify(child_process.exec);
import fs from "fs";
import { generateDeployer } from "./utils/parse";

//./test/script/token/31337.json

async function main() {
  const path = await exec("pwd");

  console.log(path.stdout);
  const scriptFile = process.argv[2];

  await generateDeployer(path.stdout.replace("\n", ""), scriptFile);
}

main();
