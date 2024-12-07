# Fuse

Fuse is a deployment tool specifically designed for Foundry. Developers can use Fuse to create deployment scripts that are easy to maintain and highly readable, allowing them to focus more on contract interactions rather than managing constructor parameters. It is suitable for scenarios where multiple contracts need to be deployed across multiple chains.

# Install

Install Fuse globally via npm:

```base
npm i -g @fuse-kit/fuse
```

# How to use Fuse?

Fuse is a command-line tool used to parse parameters from a JSON file and generate `Deployer.sol`. `Deployer.sol` will create corresponding deployment functions based on the contents of the JSON."

To use Fuse, a specific folder structure needs to be created to allow Fuse to parse and extract specific data. You need to follow the `script/<script file>/config/<chain id>.json` format, and `Deployer.sol` will be generated under the `<script file>` folder."

```
project-root/
├── src/
│   ├── core/
│   │   └── Vault.sol
│   └── periphery/
│       └── Router.sol
├── script/
│   ├── core/
│   │   ├── Core.s.sol
│   │   ├── Deployer.sol
│   │   └── config/
│   │       ├── 31337.json
│   │       └── 1.json
│   └── periphery
│       ├── Periphery.s.sol
│       ├── Deployer.sol
│       └── config/
│           └── 31337.json
```

- `<script file>`: Custom script name, users can define any name they want
- `<chian id>.json`: Primarily used to record constructor parameters in a JSON file, distinguished by chain ID, making data management for multi-chain deployments simpler. (e.g. 1.json (mainnet) / 31337.json (localhost) / 11155111.json (sepolia)). Multiple JSON files can be created in a `config`folder.

If you want to generate `Deployer.sol` automatically, use this command:

```bash
fuse <script file>
```

You can check the [Fuse example](https://github.com/LI-YONG-QI/fuse_example)

# Config JSON & Deployer

The config JSON and `Deployer.sol` are paired with each other. Each generation of the Deployer is based on the data types in the config JSON.

The JSON file is primarily used to configure constructor parameters. Developers can freely configure the parameters to be used based on the contracts in the script and distinguish them accordingly. For example, if `Core.s.sol` needs to deploy ` Token.sol`, the JSON configuration would be as follows:

- `Token.sol`

```solidity
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint256 public x;
    uint256 public y;

    constructor(uint256 _x, uint256 _y, address owner) ERC20("", "") Ownable(owner) {
        x = _x;
        y = _y;
    }
}

```

- Config JSON:

```json
{
  "Token": {
    "_x": 1,
    "_y": 2,
    "owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
}
```

- `Deployer.sol`

```solidity
pragma solidity ^0.8.0;

import {Config} from "forge_deploy/Config.sol";
import {Vm} from "forge-std/Vm.sol";

library Deployer {
    using Config for *;

    Vm internal constant vm = Config.vm;

    string constant ROOT = "core";

    struct TokenConfig {
        uint256 _x;
        uint256 _y;
        address owner;
    }

    function deployToken() internal returns (address) {
        bytes memory configJson = ROOT.loadConfig(block.chainid, "Token");

        (uint256 _x, uint256 _y, address owner) = abi.decode(configJson, (uint256, uint256, address));

        bytes memory args = abi.encode(_x, _y, owner);
        bytes memory bytecode = vm.getCode("Token");

        return Config.deploy(abi.encodePacked(bytecode, args));
    }
}

```
