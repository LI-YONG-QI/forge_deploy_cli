<p align="center">
<img src="https://i.imgur.com/QZeRpCx.png" alt="Logo" width="100" height="100">
</p>

# Fuse

Fuse is a deployment tool specifically designed for Foundry. Developers can use Fuse to create deployment scripts that are easy to maintain and highly readable, allowing them to focus more on contract interactions rather than managing constructor parameters. It is suitable for scenarios where multiple contracts need to be deployed across multiple chains.

# Install

Install Fuse globally via npm:

```base
npm i -g @fuse-kit/fuse
```

Install [fuse library contract](https://github.com/LI-YONG-QI/fuse-contracts) in Foundry project

```base
forge install LI-YONG-QI/fuse-contracts
```

# How to use Fuse?

Fuse is a command-line tool used to parse parameters from a JSON file and generate `Deployer.sol`. `Deployer.sol` will create corresponding deployment functions based on the contents of the JSON."

To use Fuse, a specific folder structure needs to be created to allow Fuse to parse and extract specific data. You need to follow the `script/<script folder>/config/<chainId>.json` format, and `Deployer.sol` will be generated under the `<script folder>`"

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

- `<script folder>`: Custom script name, users can define any name they want. `core/` and `periphery/` are script folders in this case
- `<chianId>.json`: Primarily used to configure constructor parameters in a JSON file, distinguished by chain ID, making environment management for multi-chain deployments simpler. (e.g. 1.json (mainnet) / 31337.json (localhost) / 11155111.json (sepolia)). Multiple JSON files can be created in a `config/` folder.

If you want to generate `Deployer.sol` automatically, use this command at project root:

```bash
// cd project-root
fuse <script file>
```

You can check the [Fuse example](https://github.com/LI-YONG-QI/fuse_example)

## Config JSON & Deployer

The config JSON and `Deployer.sol` are paired with each other. Each generation of the Deployer is based on the data types in the config JSON.

The JSON file is primarily used to configure constructor parameters. Developers can freely configure the parameters to be used based on the contracts in the script and distinguish them accordingly.

Format in JSON:

In <chianId>.json

```json
{
  "Contract1": {
    "arg1": 1,
    "arg2": 2
  },
  "Contract2": {
    "arg1": 1,
    "arg2": 2
  }
}
```

To parse correctly, name of argument (e.g. arg1 / arg2) in JSON **must same as** constructor

## Static arguments

`Token.sol`

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

In Fuse, arguments that can be hardcoded are referred to as **static arguments**. In other words, these parameters can be directly configured in the JSON file.

```json
{
  "Token": {
    "_x": 1,
    "_y": 2,
    "owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
}
```

`_x` `_y` `owner` are static arguments

## Dynamic arguments

In some cases, developers cannot know certain arguments in advance. For example, the current time of deployment or the address of a contract deployed earlier in the same deployment script. These arguments are referred to as **dynamic arguments**. Unlike static arguments, dynamic arguments cannot be hardcoded in the JSON file in advance.

Therefore, during the generation of the `Deployer.sol`, it will automatically check which arguments are missing from the JSON (i.e. dynamic arguments) and generate them as arguments for the deploy function.

```json
{
  "Token": {
    "_x": 1,
    "_y": 2
  }
}
```

`Deployer.sol`

```solidity
function deployToken(address owner) internal returns (address) {
    bytes memory configJson = ROOT.loadConfig(block.chainid, "Token");

    (uint256 _x, uint256 _y) = abi.decode(configJson, (uint256, uint256));

    bytes memory args = abi.encode(_x, _y, owner);
    bytes memory bytecode = vm.getCode("Token");

    return Config.deploy(abi.encodePacked(bytecode, args));
}
```

`owner` is dynamic argument

## Use case

For example, if `Core.s.sol` (script contract) needs to deploy `Token.sol`, the JSON configuration would be as follows:

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

Note: Name of arguments must same as constructor, (i.e. not x)

- `Deployer.sol` (generated)

```solidity
pragma solidity ^0.8.0;

import {Config} from "forge_deploy/Config.sol";
import {Vm} from "forge-std/Vm.sol";

library Deployer {
    using Config for *;

    Vm internal constant vm = Config.vm;

    string constant ROOT = "core"; // Generated by script file name

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

Import `Deployer.sol` library in `Core.s.sol`:

```solidity
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.13;

import {Deployer} from "./Deployer.sol";
import {Script, console} from "forge-std/Script.sol";
import {Token} from "../../src/Token.sol";

contract CoreScript is Script {
    function run() external {
        vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

        address tokenAddr = Deployer.deployToken();
        Token token = Token(tokenAddr);

        console.log("Token x:", token.x());
        console.log("Token y:", token.y());
        console.log("Token owner:", token.owner());

        vm.stopBroadcast();
    }
}

```

# Getting Started

## Prerequisites

- Check you already installed Fuse globally via npm:

```base
npm i -g @fuse-kit/fuse
```

- Create a Foundry project

```bash
mkdir fuse-demo && cd fuse-demo && forge init
```

## Started

1. Configure read/write permissions in `foundry.toml`

```toml
# add this line on `[profile.default]` field
fs_permissions = [{ access = "read-write", path = "./"}]
```

2. Install `fuse-contracts` as dependencies

```bash
forge install LI-YONG-QI/fuse-contracts
```

3. Add `constructor` in `Counter.sol`

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number;

    constructor(uint256 _number) {
        number = _number;
    }

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}

```

4. Compile (build `out/`):

```bash
forge build
```

5. Modify script folder structure: add `counter/config/31337.json` under `script/` folder, and move `Counter.s.sol` under `counter/` folder

Like this:

```
script/
│   ├── counter/
│   │   ├── Counter.s.sol
│   │   └── config/
│   │       └──31337.json
```

6. Configure `Counter` contract args:
   In `counter/config/31337.json`

```json
{
  "Counter": {
    "_number": 1
  }
}
```

7. Generate `Deployer.sol` (please check your terminal path on project root)

```bash
fuse counter
```

output:

```bash
{ number: 1 }
Finish Write
```

8. Update `Counter.s.sol`

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Deployer} from "./Deployer.sol"; // import Deployer

contract CounterScript is Script {
    function setUp() public {}

    function run() public {
        address counter = Deployer.deployCounter();
        console.log("Counter deployed at:", counter);
    }
}
```

9. Try to execute this script

```base
forge script CounterScript
```

output:

```bash
Counter deployed at: 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
```
