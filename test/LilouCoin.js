const { expect } = require("chai");

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

async function deployTasksFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();

  const lilouCoin = await ethers.deployContract("LilouCoin");

  await lilouCoin.waitForDeployment();

  return { lilouCoin, owner, addr1, addr2, holder: "0x29F2D60B0e77f76f7208FA910C51EFef98480501" };
}

describe("LilouCoin contract", function () {
  it("Should get the current balance of one of the holders", async function () {
    const { lilouCoin, holder } = await loadFixture(deployTasksFixture);

    const balance = await lilouCoin.balanceOf(holder);
    expect(balance).to.equal(21_000_000_00);
  });
});

