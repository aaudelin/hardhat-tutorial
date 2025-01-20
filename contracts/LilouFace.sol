// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { ERC721 as IERC721 } from "./interface/IERC721.sol";
import "hardhat/console.sol";

contract LilouFace is IERC721 {
    error InvalidAddress(address account);
    error InvalidNft(uint256 tokenId);
    error UnauthorizedAddress(address owner, address operator, uint256 tokenId);
    error WrongOwner(address owner, address operator, uint256 tokenId);

    mapping(address owner => uint256 tokensCount) private _balances;
    mapping(uint256 tokenId => address owner) private _owners;
    mapping(uint256 tokenId => address approval) private _approvals;
    mapping(address owner => mapping(address operator => bool status)) private _operators;

    constructor() {
        _balances[0x73096Ed178C96e7096Ad3329Fd092be3D16A725E] = 1;
        _owners[424242] = 0x73096Ed178C96e7096Ad3329Fd092be3D16A725E;

        _balances[0x5B38Da6a701c568545dCfcB03FcB875f56beddC4] = 1;
        _owners[121212] = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;
    }

    function balanceOf(address _owner) external view returns (uint256) {
        if (_owner == address(0)) {
            revert InvalidAddress(_owner);
        }
        return _balances[_owner];
    }

    function ownerOf(uint256 _tokenId) external view returns (address) {
        address owner = _owners[_tokenId];
        if (owner == address(0)) {
            revert InvalidNft(_tokenId);
        }
        return owner;
    } 

    function transferFrom(address _from, address _to, uint256 _tokenId) external payable {
        if (_to == address(0)) {
            revert InvalidAddress(_to);
        }
        if (_owners[_tokenId] == address(0)) {
            revert InvalidNft(_tokenId);
        }
        if (_from != _owners[_tokenId]) {
            revert WrongOwner(_from, msg.sender, _tokenId);
        }
        if (msg.sender != _owners[_tokenId] 
            && msg.sender != _approvals[_tokenId] 
            && _operators[_from][msg.sender] == false
        ) {
            revert UnauthorizedAddress(_from, msg.sender, _tokenId);
        }

        _balances[_from] -= 1;
        _balances[_to] += 1;
        
        _owners[_tokenId] = _to;

        _approvals[_tokenId] = address(0);
        
        emit Transfer(_from, _to, _tokenId);
    }

    function approve(address _approved, uint256 _tokenId) external payable {
        address owner = _owners[_tokenId];
        if (msg.sender != owner
            && _operators[owner][msg.sender] == false
        ) {
            revert UnauthorizedAddress(owner, msg.sender, _tokenId);
        }
        _approvals[_tokenId] = _approved;

        emit Approval(owner, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        if (_operator == address(0)) {
            revert InvalidAddress(_operator);
        }

        _operators[msg.sender][_operator] = _approved;

        emit ApprovalForAll(msg.sender, _operator, _approved);

    }

    function getApproved(uint256 _tokenId) external view returns (address) {
        if (_owners[_tokenId] == address(0)) {
            revert InvalidNft(_tokenId);
        }

        return _approvals[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return _operators[_owner][_operator];
    }


}