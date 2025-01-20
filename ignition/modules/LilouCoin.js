const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const LilouCoinModule = buildModule("LilouCoinModule", (m) => {
  const lilouCoin = m.contract("LilouCoin");

  return { lilouCoin };
});

module.exports = LilouCoinModule;
