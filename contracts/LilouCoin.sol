// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LilouCoin is IERC20 {

    mapping(address account => uint256) private _balances;
    mapping(address owner => mapping(address spender => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    error InsufficientFunds(address from, uint256 remainingFunds, uint256 expectedValue);
    error NotAllowed(address spender, address owner, uint256 remainingFunds, uint256 expectedtransfer);

    constructor() {
        symbol = "LLC";
        name = "Lilou Coin";
        decimals = 2;
        _totalSupply = 42_000_000 * (10 ** decimals);
        _balances[0x29F2D60B0e77f76f7208FA910C51EFef98480501] = _totalSupply/2;
        _balances[0x73096Ed178C96e7096Ad3329Fd092be3D16A725E] = _totalSupply/2;
        emit Transfer(address(0), address(this), _totalSupply);
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) external override returns (bool) {
       return _transfer(msg.sender, to, value);
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        uint256 allowanceValue = _allowances[msg.sender][from];


        if (allowanceValue < value) {
            revert NotAllowed(msg.sender, from, allowanceValue, value);
        }
        return _transfer(from, to, value);
    }

    function _transfer(address from, address to, uint256 value) private returns (bool) {
         uint256 senderBalance = _balances[from];
        if (senderBalance < value) {
            revert InsufficientFunds(from, senderBalance, value);
        }
        _balances[from] -= value;
        _balances[to] += value;

        emit Transfer(from, to, value);
        return true;
    }

}