const { expect } = require("chai");

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers, network } = require("hardhat");

async function deployLilouCoinFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const holder = await ethers.getImpersonatedSigner(
    "0x29F2D60B0e77f76f7208FA910C51EFef98480501"
  );

  await network.provider.send("hardhat_setBalance", [
    holder.address,
    "0x1000000000000000000000000",
  ]);

  const lilouCoin = await ethers.deployContract("LilouCoinZeppelin");

  await lilouCoin.waitForDeployment();

  return {
    lilouCoin,
    owner,
    addr1,
    addr2,
    holder,
  };
}

describe("LilouCoin contract using Zeppelin ERC20", function () {

  it("Should revert the transfer if the owner is Zero Address", async function () {
    const { lilouCoin, addr1 } = await loadFixture(deployLilouCoinFixture);
    const holderZeroAddress = await ethers.getImpersonatedSigner(
      ethers.ZeroAddress
    );
    await network.provider.send("hardhat_setBalance", [
      holderZeroAddress.address,
      "0x1000000000000000000000000",
    ]);

    await expect(lilouCoin.connect(holderZeroAddress).transfer(addr1.address, 100))
      .to.be.revertedWithCustomError(lilouCoin, "ERC20InvalidSender")
      .withArgs(ethers.ZeroAddress);
  });

  it("Should revert the transfer if the receiver is Zero Address", async function () {
    const { lilouCoin} = await loadFixture(deployLilouCoinFixture);

    await expect(lilouCoin.transfer(ethers.ZeroAddress, 100))
      .to.be.revertedWithCustomError(lilouCoin, "ERC20InvalidReceiver")
      .withArgs(ethers.ZeroAddress);
  });

  it("Should revert the approval if owner is Zero Address", async function () {
    const { lilouCoin, addr1 } = await loadFixture(deployLilouCoinFixture);
    const holderZeroAddress = await ethers.getImpersonatedSigner(
      ethers.ZeroAddress
    );
    await network.provider.send("hardhat_setBalance", [
      holderZeroAddress.address,
      "0x1000000000000000000000000",
    ]);

    await expect(lilouCoin.connect(holderZeroAddress).approve(addr1.address, 100))
      .to.be.revertedWithCustomError(lilouCoin, "ERC20InvalidApprover")
      .withArgs(ethers.ZeroAddress);
  });

  it("Should revert the approval if the spender is Zero Address", async function () {
    const { lilouCoin } = await loadFixture(deployLilouCoinFixture);

    await expect(lilouCoin.approve(ethers.ZeroAddress, 100))
      .to.be.revertedWithCustomError(lilouCoin, "ERC20InvalidSpender")
      .withArgs(ethers.ZeroAddress);
  });
});
