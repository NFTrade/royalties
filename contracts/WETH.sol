// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {

    string private _name = "WETH";
    string private constant _symbol = "WETH";
    uint   private constant _numTokens = 100000000;

    constructor () public ERC20(_name, _symbol) {
        _mint(msg.sender, _numTokens * (10 ** 18));
    }
}