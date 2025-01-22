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

  const lilouCoin = await ethers.deployContract("LilouCoin");

  await lilouCoin.waitForDeployment();

  return {
    lilouCoin,
    owner,
    addr1,
    addr2,
    holder,
  };
}

describe("LilouCoin contract", function () {
  it("Should get the total supply of the token", async function () {
    const { lilouCoin } = await loadFixture(deployLilouCoinFixture);

    const totalSupply = await lilouCoin.totalSupply();
    expect(totalSupply).to.equal(42_000_000_00);
  });

  it("Should get the current balance of one of the holders", async function () {
    const { lilouCoin, holder } = await loadFixture(deployLilouCoinFixture);

    const balance = await lilouCoin.balanceOf(holder);
    expect(balance).to.equal(21_000_000_00);
  });

  it("Should get the name of the token", async function () {
    const { lilouCoin } = await loadFixture(deployLilouCoinFixture);

    const name = await lilouCoin.name();
    expect(name).to.equal("Lilou Coin");
  });

  it("Should get the symbol of the token", async function () {
    const { lilouCoin } = await loadFixture(deployLilouCoinFixture);

    const symbol = await lilouCoin.symbol();
    expect(symbol).to.equal("LLC");
  });

  it("Should get the decimals of the token", async function () {
    const { lilouCoin } = await loadFixture(deployLilouCoinFixture);

    const decimals = await lilouCoin.decimals();
    expect(decimals).to.equal(2);
  });

  it("Should send an approval event when an address is approved to spend on behalf of the owner", async function () {
    const { lilouCoin, owner, holder } = await loadFixture(
      deployLilouCoinFixture
    );

    const allowedAmount = 1000_00;

    await expect(lilouCoin.approve(holder.address, allowedAmount))
      .to.emit(lilouCoin, "Approval")
      .withArgs(owner.address, holder.address, allowedAmount);
  });

  it("Should get the allowance of the owner once another address is approved to spend on his behalf", async function () {
    const { lilouCoin, owner, holder } = await loadFixture(
      deployLilouCoinFixture
    );

    const allowedAmount = 1000_00;

    await lilouCoin.approve(holder.address, allowedAmount);

    const allowance = await lilouCoin.allowance(owner.address, holder.address);
    expect(allowance).to.equal(allowedAmount);
  });

  it("Should send a transfer event when a transfer is made", async function () {
    const { lilouCoin, owner, holder } = await loadFixture(
      deployLilouCoinFixture
    );

    const transferAmount = 1000_00;

    await expect(
      lilouCoin.connect(holder).transfer(owner.address, transferAmount)
    )
      .to.emit(lilouCoin, "Transfer")
      .withArgs(holder.address, owner.address, transferAmount);
  });

  it("Should revert if the spender does not have enough allowance", async function () {
    const { lilouCoin, owner, holder } = await loadFixture(
      deployLilouCoinFixture
    );

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
    const { lilouCoin, owner, holder } = await loadFixture(
      deployLilouCoinFixture
    );

    const allowedAmount = 1000_00;
    const transferAmount = 500_00;
    await lilouCoin.connect(holder).approve(owner.address, allowedAmount);

    await lilouCoin.transferFrom(holder.address, owner.address, transferAmount);

    const allowance = await lilouCoin.allowance(holder.address, owner.address);
    expect(allowance).to.equal(allowedAmount - transferAmount);
  });

  it("Should revert if the sender does not have enough funds", async function () {
    const { lilouCoin, owner, addr1 } = await loadFixture(
      deployLilouCoinFixture
    );

    const transferAmount = 1000_00;
    await lilouCoin.connect(addr1).approve(owner.address, transferAmount);

    await expect(
      lilouCoin.transferFrom(addr1.address, owner.address, transferAmount)
    )
      .to.be.revertedWithCustomError(lilouCoin, "InsufficientFunds")
      .withArgs(addr1.address, 0, transferAmount);
  });
});
