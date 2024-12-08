import { promises } from "fs";
import { build, getConfig } from "./builder";

import util from "util";
import child_process from "child_process";

const exec = util.promisify(child_process.exec);

async function getConfigPath(path: string) {
  const configs = await exec("ls " + path);
  const config = configs.stdout.split("\n")[0]; // Get first config file name in script folder
  return path + "/" + config;
}

async function buildStructsAndFunctions(root: string, configPath: string) {
  let structAndFunctions = "";

  // Get all contracts in config file
  const config = await getConfig(configPath);
  for (const [key] of Object.entries(config)) {
    const contractName = key;
    const abiPath = `${root}/out/${contractName}.sol/${contractName}.json`;
    structAndFunctions += await build(contractName, abiPath, configPath);
  }

  return structAndFunctions;
}

async function buildDeployer(root: string, scriptFile: string) {
  const configPath = await getConfigPath(`${root}/script/${scriptFile}/config`);

  return await buildStructsAndFunctions(root, configPath);
}

export async function buildLibrary(root: string, scriptFile: string) {
  const path = `${root}/script/${scriptFile}/Deployer.sol`;
  let structAndFunctions = await buildDeployer(root, scriptFile);

  let contract: string = `
    pragma solidity ^0.8.0;

    import {Config} from "fuse-contracts/Config.sol";
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
