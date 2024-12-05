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

export async function buildStruct(contractName: string, abiPath: string) {
  const abi = await getAbi(abiPath);
  const inputs = abi[0].inputs;

  let fields: string = "";

  inputs.forEach((input: Input) => {
    fields += `${input.type} ${input.name}; \n`;
  });

  let configStruct: string = `
  struct ${contractName}Config {
    ${fields}
  }
`;

  return configStruct;
}

export async function buildDeployer(
  contractName: string,
  abiPath: string,
  configPath: string
) {
  const abi = await getAbi(abiPath);
  const inputs = abi[0].inputs;

  const config = await getConfig(configPath);
  const tokenConfig = config[contractName as keyof typeof config];

  let dynamicArgsList: Input[] = [];
  let staticArgsList: { type: string; name: string; value: unknown }[] = [];

  inputs.forEach((input: Input) => {
    if (input.name in tokenConfig) {
      staticArgsList.push({
        type: input.type,
        name: input.name,
        value: tokenConfig[input.name as keyof typeof tokenConfig],
      });
    } else {
      dynamicArgsList.push(input);
    }
  });

  let dynamicArgs = dynamicArgsList
    .map((input) => `${input.type} ${input.name}`)
    .join(", ");
  let staticArgs = staticArgsList
    .map((arg) => `${arg.type} ${arg.name} = ${arg.value};\n`)
    .join("");

  let base = `function deploy${contractName}(${dynamicArgs}) internal returns (address) {
    ${staticArgs}

    ${contractName}Config memory config = ${contractName}Config({_x: _x, _y: _y, _token: _token});
    bytes memory args = abi.encode(config);

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
  const structString = await buildStruct(contractName, abiPath);
  const deployerString = await buildDeployer(contractName, abiPath, configPath);

  return `
    ${structString}
    ${deployerString}
  `;
}
