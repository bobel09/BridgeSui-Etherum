// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/IBT.sol";

contract DeployIBT is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy the IBT contract
        IBT ibt = new IBT();
        console.log("IBT deployed at:", address(ibt));

        vm.stopBroadcast();
    }
}
