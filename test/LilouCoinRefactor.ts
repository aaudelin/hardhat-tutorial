import { expect } from "chai";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { LilouCoin } from "../typechain-types/contracts/LilouCoin";

describe("LilouCoin refactored tests", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let holder: SignerWithAddress;
  let lilouCoin: LilouCoin;

  before(async function () {
    [owner, addr1, addr2, holder] = await ethers.getSigners();
  });
  
  beforeEach(async function () {
    const LilouToken = await ethers.getContractFactory('LilouCoinRefactor');
    lilouCoin = (await LilouToken.deploy(owner.address, holder.address)) as LilouCoin;
  });

  describe("Test total supply ", function () {
    it("Should get the total supply of the token", async function () {
      const totalSupply = await lilouCoin.totalSupply();
      expect(totalSupply).to.equal(42_000_000_00);
    });
  });

  describe("Test current balance of one of the holders", function () {
    it("Should get the current balance of one of the holders", async function () {
      const balance = await lilouCoin.balanceOf(holder);
      expect(balance).to.equal(21_000_000_00);
    });

    it("Should return 0 if the address has no balance", async function () {
      const balance = await lilouCoin.balanceOf(addr1);
      expect(balance).to.equal(0);
    });
  });

  describe("Test name", function () {
    it("Should get the name of the token", async function () {
      const name = await lilouCoin.name();
      expect(name).to.equal("Lilou Coin");
    });
  });

  describe("Test symbol", function () {
    it("Should get the symbol of the token", async function () {
      const symbol = await lilouCoin.symbol();
      expect(symbol).to.equal("LLC");
    });
  });

  describe("Test decimals", function () {
    it("Should get the decimals of the token", async function () {
      const decimals = await lilouCoin.decimals();
      expect(decimals).to.equal(2);
    });
  });

  describe("Test allowance", function() {
    it("Should return 0 if there is no allowance", async function () {

      const allowance = await lilouCoin.allowance(
        owner.address,
        holder.address
      );
      expect(allowance).to.equal(0);
    });

    it("Should get the allowance of the owner once another address is approved to spend on his behalf", async function () {

      const allowedAmount = 1000_00;

      await lilouCoin.approve(holder.address, allowedAmount);

      const allowance = await lilouCoin.allowance(
        owner.address,
        holder.address
      );
      expect(allowance).to.equal(allowedAmount);
    });

    it("Should return 0 if the requested owner is the ZeroAddress", async function () {
      const allowance = await lilouCoin.allowance(
        ethers.ZeroAddress,
        holder.address
      );
      expect(allowance).to.equal(0);
    });

    it("Should return 0 if the requested spender is the ZeroAddress", async function () {
      const allowance = await lilouCoin.allowance(
        owner.address,
        ethers.ZeroAddress
      );
      expect(allowance).to.equal(0);
    });
  });

  describe("Test approval", function () {
    it("Should send an approval event when an address is approved to spend on behalf of the owner", async function () {
      const allowedAmount = 1000_00;

      await expect(lilouCoin.approve(holder.address, allowedAmount))
        .to.emit(lilouCoin, "Approval")
        .withArgs(owner.address, holder.address, allowedAmount);
    });

    it("Should erase the previous allowance if a new allowance is made", async function () {
      const firstAmount = 1000_00;
      await lilouCoin.approve(holder.address, firstAmount);
      const firstAllowance = await lilouCoin.allowance(owner.address, holder.address);
      
      const secondAmount = 2000_00;
      await lilouCoin.approve(holder.address, secondAmount);
      const secondAllowance = await lilouCoin.allowance(owner.address, holder.address);
      
      expect(secondAllowance).to.equal(secondAmount);
      expect(secondAllowance).to.not.equal(firstAllowance);
    });
  });

  describe("Test transfer", function () {
    it("Should send a transfer event when a transfer is made", async function () {
      const transferAmount = 1000_00;
      
      await expect(
        lilouCoin.connect(holder).transfer(owner.address, transferAmount)
      )
      .to.emit(lilouCoin, "Transfer")
      .withArgs(holder.address, owner.address, transferAmount);
    });

    it("Should revert if the sender does not have enough funds", async function () {
      const transferAmount = 22_000_000_00;
      const holderBalance = await lilouCoin.balanceOf(holder.address);
      await expect(
        lilouCoin.connect(holder).transfer(owner.address, transferAmount)
      )
        .to.be.revertedWithCustomError(lilouCoin, "InsufficientFunds")
        .withArgs(holder.address, holderBalance, transferAmount);
    });

    it("Should decrease the balance of the sender and increase the balance of the recipient", async function () {
      const transferAmount = ethers.toBigInt(1000_00);
      const holderBalance = await lilouCoin.balanceOf(holder.address);

      await lilouCoin.connect(holder).transfer(addr1.address, transferAmount);
      const newHolderBalance = await lilouCoin.balanceOf(holder.address);
      expect(newHolderBalance).to.equal(holderBalance - transferAmount);

      const receiverBalance = await lilouCoin.balanceOf(addr1.address);
      expect(receiverBalance).to.equal(transferAmount);
    });
  });

  describe("Test transferFrom", function () {
    it("Should revert if the spender does not have enough allowance", async function () {

      const allowedAmount = 500_00;
      const transferAmount = 1000_00;
      await lilouCoin.connect(holder).approve(owner.address, allowedAmount);

      await expect(
        lilouCoin.transferFrom(holder.address, owner.address, transferAmount)
      )
        .to.be.revertedWithCustomError(lilouCoin, "NotAllowed")
        .withArgs(owner.address, holder.address, allowedAmount, transferAmount);
    });

    it("Should decrease the allowance when a transfer is made", async function () {

      const allowedAmount = 1000_00;
      const transferAmount = 500_00;
      await lilouCoin.connect(holder).approve(owner.address, allowedAmount);

      await lilouCoin.transferFrom(
        holder.address,
        owner.address,
        transferAmount
      );

      const allowance = await lilouCoin.allowance(
        holder.address,
        owner.address
      );
      expect(allowance).to.equal(allowedAmount - transferAmount);
    });

    it("Should revert if the sender does not have enough funds", async function () {

      const transferAmount = 1000_00;
      await lilouCoin.connect(addr1).approve(owner.address, transferAmount);

      await expect(
        lilouCoin.transferFrom(addr1.address, owner.address, transferAmount)
      )
        .to.be.revertedWithCustomError(lilouCoin, "InsufficientFunds")
        .withArgs(addr1.address, 0, transferAmount);
    });
  });
});
