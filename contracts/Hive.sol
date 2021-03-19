// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Example class - a mock class using delivering from ERC20
contract Hive is ERC20 {
  constructor(uint256 initialBalance) ERC20("Hive", "HIVE") public {
      _mint(msg.sender, initialBalance);
  }
}
