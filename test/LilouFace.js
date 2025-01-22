const { expect } = require("chai");

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers, network } = require("hardhat");

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

  it("Should revert transferFrom if the to address is the Zero Address", async function () {
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

  it("Should revert transferFrom if the NFT is not found", async function () {
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

  it("Should revert transferFrom if sender is not the owner", async function () {
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

  it("Should revert transferFrom if sender is not the owner or approved", async function () {
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

  it("Should approve the address to transfer the NFT", async function () {
    const { lilouFace, holder, addr1, holderNFTId, owner } = await loadFixture(
      deployLilouFaceFixture
    );

    await expect(lilouFace.connect(holder).approve(addr1.address, holderNFTId))
      .to.emit(lilouFace, "Approval")
      .withArgs(holder.address, addr1.address, holderNFTId);

    const approved = await lilouFace.getApproved(holderNFTId);
    expect(approved).to.equal(addr1.address);

    await expect(
      lilouFace
        .connect(addr1)
        .transferFrom(holder.address, owner.address, holderNFTId)
    )
      .to.emit(lilouFace, "Transfer")
      .withArgs(holder.address, owner.address, holderNFTId);
  });

  it("Should revert the approval if the sender is not the owner or approved", async function () {
    const { lilouFace, addr1, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await expect(
      lilouFace.connect(addr1).approve(addr1.address, holderNFTId)
    ).to.be.revertedWithCustomError(lilouFace, "UnauthorizedAddress");
  });

  it("Should set the approval for all tokens", async function () {
    const { lilouFace, holder, addr1 } = await loadFixture(
      deployLilouFaceFixture
    );

    const isApprovedNew = true;
    await expect(
      lilouFace.connect(holder).setApprovalForAll(addr1.address, isApprovedNew)
    )
      .to.emit(lilouFace, "ApprovalForAll")
      .withArgs(holder.address, addr1.address, isApprovedNew);

    const isApproved = await lilouFace.isApprovedForAll(
      holder.address,
      addr1.address
    );
    expect(isApproved).to.equal(isApprovedNew);
  });

  it("Should revert the approval for all tokens if the operator is the zero address", async function () {
    const { lilouFace } = await loadFixture(deployLilouFaceFixture);

    await expect(
      lilouFace.setApprovalForAll(ethers.ZeroAddress, true)
    ).to.be.revertedWithCustomError(lilouFace, "InvalidAddress");
  });

  it("Should transfer the NFT from the holder to the new owner if the approval for all is set", async function () {
    const { lilouFace, holder, addr1, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await lilouFace.connect(holder).setApprovalForAll(addr1.address, true);

    await expect(
      lilouFace
        .connect(addr1)
        .transferFrom(holder.address, addr1.address, holderNFTId)
    )
      .to.emit(lilouFace, "Transfer")
      .withArgs(holder.address, addr1.address, holderNFTId);
  });

  it("Should approve the address to transfer the NFT if the approval for all is set", async function () {
    const { lilouFace, holder, addr1, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await lilouFace.connect(holder).setApprovalForAll(addr1.address, true);

    await expect(lilouFace.connect(addr1).approve(addr1.address, holderNFTId))
      .to.emit(lilouFace, "Approval")
      .withArgs(holder.address, addr1.address, holderNFTId);
  });

  it("Should return the approved address for a token", async function () {
    const { lilouFace, holder, addr1, holderNFTId } = await loadFixture(
      deployLilouFaceFixture
    );

    await lilouFace.connect(holder).approve(addr1.address, holderNFTId);

    const approved = await lilouFace.getApproved(holderNFTId);
    expect(approved).to.equal(addr1.address);
  });

  it("Should revert the getApproved if the NFT is not found", async function () {
    const { lilouFace } = await loadFixture(deployLilouFaceFixture);
    const notFoundNFT = 999999;

    await expect(lilouFace.getApproved(notFoundNFT))
      .to.be.revertedWithCustomError(lilouFace, "InvalidNft")
      .withArgs(notFoundNFT);
  });

  it("Should return true if the approval for all is set", async function () {
    const { lilouFace, holder, addr1 } = await loadFixture(
      deployLilouFaceFixture
    );

    await lilouFace.connect(holder).setApprovalForAll(addr1.address, true);

    const isApproved = await lilouFace.isApprovedForAll(
      holder.address,
      addr1.address
    );
    expect(isApproved).to.equal(true);
  });
});
