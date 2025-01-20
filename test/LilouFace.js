const { expect } = require("chai");

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { network } = require("hardhat");

async function deployLilouFaceFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const holder = await ethers.getImpersonatedSigner(
    "0x73096Ed178C96e7096Ad3329Fd092be3D16A725E"
  );

  const holderNFTId = 424242;

  await network.provider.send("hardhat_setBalance", [
    holder.address,
    "0x1000000000000000000000000",
  ]);

  const lilouFace = await ethers.deployContract("LilouFace");

  await lilouFace.waitForDeployment();

  return {
    lilouFace,
    owner,
    addr1,
    addr2,
    holder,
    holderNFTId,
  };
}

describe("LilouFace contract", function () {
  it("Should get the balance of the owner that has 1 NFT", async function () {
    const { lilouFace, holder } = await loadFixture(deployLilouFaceFixture);

    const balance = await lilouFace.balanceOf(holder.address);
    expect(balance).to.equal(1);
  });

  it("Should revert if the owner is the zero address", async function () {
    const { lilouFace } = await loadFixture(deployLilouFaceFixture);

    await expect(lilouFace.balanceOf(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(lilouFace, "InvalidAddress")
      .withArgs(ethers.ZeroAddress);
  });

  it("Should get the owner of the NFT", async function () {
    const { lilouFace, holder, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    const owner = await lilouFace.ownerOf(holderNFTId);
    expect(owner).to.equal(holder.address);
  });

  it("Should revert if the NFT is not found", async function () {
    const { lilouFace } = await loadFixture(deployLilouFaceFixture);
    const notFoundNFT = 999999;

    await expect(lilouFace.ownerOf(notFoundNFT))
      .to.be.revertedWithCustomError(lilouFace, "InvalidNft")
      .withArgs(notFoundNFT);
  });

  it("Should transfer the NFT from the holder to the new owner", async function () {
    const { lilouFace, holder, owner, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );
    const previousOwnerBalance = await lilouFace.balanceOf(owner.address);
    const previousHolderBalance = await lilouFace.balanceOf(holder.address);

    await expect(
      lilouFace
        .connect(holder)
        .transferFrom(holder.address, owner.address, holderNFTId)
    )
      .to.emit(lilouFace, "Transfer")
      .withArgs(holder.address, owner.address, holderNFTId);

    const newOwner = await lilouFace.ownerOf(holderNFTId);
    expect(newOwner).to.equal(owner.address);
    expect(await lilouFace.balanceOf(owner.address)).to.equal(
      previousOwnerBalance + 1n
    );
    expect(await lilouFace.balanceOf(holder.address)).to.equal(
      previousHolderBalance - 1n
    );
    expect(await lilouFace.getApproved(holderNFTId)).to.equal(
      ethers.ZeroAddress
    );
  });

  it("Should revert id the to address is the Zero Address", async function () {
    const { lilouFace, holder, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await expect(
      lilouFace
        .connect(holder)
        .transferFrom(holder.address, ethers.ZeroAddress, holderNFTId)
    )
      .to.be.revertedWithCustomError(lilouFace, "InvalidAddress")
      .withArgs(ethers.ZeroAddress);
  });

  it("Should revert if the NFT is not found", async function () {
    const { lilouFace, holder, owner } = await loadFixture(
      deployLilouFaceFixture
    );
    const notFoundNFT = 999999;

    await expect(
      lilouFace
        .connect(holder)
        .transferFrom(holder.address, owner.address, notFoundNFT)
    )
      .to.be.revertedWithCustomError(lilouFace, "InvalidNft")
      .withArgs(notFoundNFT);
  });

  it("Should revert if not the owner", async function () {
    const { lilouFace, holder, addr1, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await expect(
      lilouFace
        .connect(addr1)
        .transferFrom(addr1.address, holder.address, holderNFTId)
    )
      .to.be.revertedWithCustomError(lilouFace, "WrongOwner")
      .withArgs(addr1.address, addr1.address, holderNFTId);
  });

  it("Should revert if sender is not the owner or approved", async function () {
    const { lilouFace, holder, addr1, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await expect(
      lilouFace
        .connect(addr1)
        .transferFrom(holder.address, addr1.address, holderNFTId)
    )
      .to.be.revertedWithCustomError(lilouFace, "UnauthorizedAddress")
      .withArgs(holder.address, addr1.address, holderNFTId);
  });
});
