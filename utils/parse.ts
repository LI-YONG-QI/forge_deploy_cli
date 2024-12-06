import { promises } from "fs";
import { build, getConfig } from "./builder";

import util from "util";
import child_process from "child_process";

const exec = util.promisify(child_process.exec);

async function getConfigPath(path: string) {
  const configs = await exec("ls " + path);
  const config = configs.stdout.split("\n")[0];
  return path + "/" + config;
}

async function buildStructAndFunctions(basePath: string, scriptFile: string) {
  let structAndFunctions = "";
  const configPath = await getConfigPath(
    `${basePath}/script/${scriptFile}/config`
  );

  const config = await getConfig(configPath);
  for (const [key] of Object.entries(config)) {
    const contractName = key;
    const abiPath = `${basePath}/out/${contractName}.sol/${contractName}.json`;
    structAndFunctions += await build(contractName, abiPath, configPath);
  }

  return structAndFunctions;
}

export async function generateDeployer(basePath: string, scriptFile: string) {
  const path = `${basePath}/script/${scriptFile}/Deployer.sol`;
  let structAndFunctions = await buildStructAndFunctions(basePath, scriptFile);

  let contract: string = `
    pragma solidity ^0.8.0;

    import {Config} from "../../../src/Config.sol";
    import {Vm} from "forge-std/Vm.sol";

    library Deployer {

        using Config for *;

        Vm internal constant vm = Config.vm;

        string constant ROOT = "${scriptFile}";

        ${structAndFunctions}
    }
  `;

  promises
    .writeFile(path, contract, {
      flag: "w",
    })
    .then(() => {
      console.log("Finish Write");
    });
}
