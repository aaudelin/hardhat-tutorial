// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LilouCoinZeppelin is ERC20 {

    constructor() ERC20("Lilou Coin Zeppelin", "LCZ") {
        _mint(0x29F2D60B0e77f76f7208FA910C51EFef98480501, 21_000_000 * (10 ** decimals()));
        _mint(0x73096Ed178C96e7096Ad3329Fd092be3D16A725E, 21_000_000 * (10 ** decimals()));
    }

    // For testing purposes, how can we test internal functions?
    function mint(address account, uint256 value) external {
        _mint(account, value);
    }

    // For testing purposes, how can we test internal functions?
    function burn(address account, uint256 value) external {
        _burn(account, value);
    }

}