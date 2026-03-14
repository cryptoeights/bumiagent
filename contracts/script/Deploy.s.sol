// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {EarthPool} from "../src/EarthPool.sol";
import {SpawnRegistry} from "../src/SpawnRegistry.sol";
import {AgentCommerce} from "../src/AgentCommerce.sol";

contract Deploy is Script {
    // Celo Mainnet cUSD
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    // Alfajores testnet cUSD
    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address cusd = _getCUSD();

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy EarthPool
        EarthPool earthPool = new EarthPool(cusd);
        console2.log("EarthPool deployed at:", address(earthPool));

        // 2. Deploy SpawnRegistry
        SpawnRegistry registry = new SpawnRegistry(cusd, address(earthPool), treasury);
        console2.log("SpawnRegistry deployed at:", address(registry));

        // 3. Deploy AgentCommerce
        AgentCommerce commerce = new AgentCommerce(cusd, address(registry), treasury);
        console2.log("AgentCommerce deployed at:", address(commerce));

        vm.stopBroadcast();

        console2.log("---");
        console2.log("cUSD:", cusd);
        console2.log("Treasury:", treasury);
        console2.log("Chain ID:", block.chainid);
    }

    function _getCUSD() internal view returns (address) {
        if (block.chainid == 42220) return CUSD_MAINNET;
        if (block.chainid == 44787) return CUSD_ALFAJORES;
        // For local testing, use env var or revert
        return vm.envOr("CUSD_ADDRESS", CUSD_MAINNET);
    }
}
