import { promises } from "fs";
import { build, getConfig } from "./builder";

export async function buildStructAndFunctions(
  basePath: string,
  scriptFile: string
) {
  let structAndFunctions = "";
  const configPath = `${basePath}/script/${scriptFile}/config/31337.json`; // TODO solve chain id problem

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
