const { expect } = require("chai");

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

async function deployTasksFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();

  const tasks = await ethers.deployContract("TodoList");

  await tasks.waitForDeployment();

  return { tasks, owner, addr1, addr2 };
}
describe("Tasks contract", function () {
  it("Should create a task", async function () {
    const { tasks, owner } = await loadFixture(deployTasksFixture);

    await tasks.create("Buy milk", 1, { value: ethers.parseEther("0.01") });

    const tasksList = await tasks.getAll();
    expect(tasksList).to.be.not.empty;

    const task = tasksList[0];
    expect(task.content).to.equal("Buy milk");
    expect(task.id).to.equal(1);
    expect(task.status).to.equal(1);
    expect(task.createdAt).to.be.greaterThan(0);
    expect(task.createdBy).to.equal(owner.address);
  });

  it("Should list all tasks", async function () {
    const { tasks, owner } = await loadFixture(deployTasksFixture);

    await tasks.create("Buy milk", 1, { value: ethers.parseEther("0.01") });
    await tasks.create("Buy chocolate", 2, {
      value: ethers.parseEther("0.01"),
    });
    await tasks.create("Buy candies", 3, { value: ethers.parseEther("0.01") });

    const tasksList = await tasks.getAll();
    expect(tasksList).to.be.not.empty;
    expect(tasksList.length).to.equal(3);
  });

  it("Should update a task", async function () {
    const { tasks, owner } = await loadFixture(deployTasksFixture);

    await tasks.create("Buy milk", 1, { value: ethers.parseEther("0.01") });

    await tasks.update(1, "Buy chocolate", 2);

    const tasksList = await tasks.getAll();
    expect(tasksList).to.be.not.empty;

    const task = tasksList[0];
    expect(task.content).to.equal("Buy chocolate");
    expect(task.id).to.equal(1);
    expect(task.status).to.equal(2);
    expect(task.createdAt).to.be.greaterThan(0);
    expect(task.createdBy).to.equal(owner.address);
  });

  it("Should not update a task if the sender is not the creator", async function () {
    const { tasks, owner, addr1 } = await loadFixture(deployTasksFixture);

    await tasks.create("Buy milk", 1, { value: ethers.parseEther("0.01") });

    await expect(
      tasks.connect(addr1).update(1, "Buy chocolate", 2)
    ).to.be.revertedWith("Unauthorized");
  });

  it("Should remove a task", async function () {
    const { tasks, owner } = await loadFixture(deployTasksFixture);

    await tasks.create("Buy milk", 1, { value: ethers.parseEther("0.01") });

    await tasks.remove(1);

    const tasksList = await tasks.getAll();
    expect(tasksList).to.be.not.empty;

    const task = tasksList[0];
    expect(task.id).to.equal(0);
    expect(task.content).to.equal("");
    expect(task.status).to.equal(0);
    expect(task.createdAt).to.equal(0);
    expect(task.createdBy).to.equal(ethers.ZeroAddress);
  });
});
