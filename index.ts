import util from "util";
import child_process from "child_process";
const exec = util.promisify(child_process.exec);
import fs from "fs";
import { generateDeployer } from "./utils/parse";
import { Script } from "vm";

//./test/script/token/31337.json

async function main() {
  const path = process.argv[2];
  const scriptFile = process.argv[3];

  await generateDeployer(path, scriptFile);
}

main();
