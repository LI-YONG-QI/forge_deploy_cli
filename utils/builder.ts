import type { Input } from "./type";
import fs from "fs";

interface ABI {
  inputs: Input[];
}

export async function getConfig(path: string) {
  const jsonString = await fs.promises.readFile(path, "utf-8");
  return JSON.parse(jsonString);
}

export async function getAbi(path: string) {
  const jsonString = await fs.promises.readFile(path, "utf-8");
  const json = JSON.parse(jsonString);
  return json.abi as ABI[];
}

async function getConstructor(path: string) {
  const abi = await getAbi(path);
  return abi[0].inputs;
}

async function buildStruct(contractName: string, constructorABI: Input[]) {
  let fields: string = "";

  constructorABI.forEach((arg: Input) => {
    fields += `${arg.type} ${arg.name}; \n`;
  });

  let configStruct: string = `
  struct ${contractName}Config {
    ${fields}
  }
`;

  return configStruct;
}

///@notice  This function builds the deployer function for the contract
async function buildDeployer(
  contractName: string,
  constructorABI: Input[],
  config: object
) {
  let dynamicArgsList: Input[] = [];
  let staticArgsList: { type: string; name: string; value: unknown }[] = [];
  let constructorEncodeList: string[] = [];

  constructorABI.forEach((arg: Input) => {
    constructorEncodeList.push(arg.name);

    if (arg.name in config) {
      staticArgsList.push({
        type: arg.type,
        name: arg.name,
        value: config[arg.name as keyof typeof config],
      });
    } else {
      dynamicArgsList.push(arg);
    }
  });

  const dynamicArgs = dynamicArgsList
    .map((input) => `${input.type} ${input.name}`)
    .join(", ");
  const staticArgTypes = staticArgsList.map((arg) => `${arg.type}`).join(", ");
  const staticArgs = staticArgsList
    .map((arg) => `${arg.type} ${arg.name}`)
    .join(", ");

  const constructorEncode = constructorEncodeList.join(", ");

  let base = `function deploy${contractName}(${dynamicArgs}) internal returns (address) {
    bytes memory configJson = ROOT.loadConfig(block.chainid, "${contractName}");

    (${staticArgs}) = abi.decode(configJson, (${staticArgTypes}));

    bytes memory args = abi.encode(${constructorEncode});
    bytes memory bytecode = vm.getCode("${contractName}");

    return Config._deploy(abi.encodePacked(bytecode, args));
  }
  `;

  return base;
}

export async function build(
  contractName: string,
  abiPath: string,
  configPath: string
) {
  const constructorABI = await getConstructor(abiPath);

  const config = await getConfig(configPath);
  const tokenConfig = config[contractName as keyof typeof config];
  console.log(tokenConfig);

  const structString = await buildStruct(contractName, constructorABI);
  const deployerString = await buildDeployer(
    contractName,
    constructorABI,
    tokenConfig
  );

  return `
    ${structString}
    ${deployerString}
  `;
}
