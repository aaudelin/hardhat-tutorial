const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const LilouFaceModule = buildModule("LilouFaceModule", (m) => {
  const lilouFace = m.contract("LilouFace");

  return { lilouFace };
});

module.exports = LilouFaceModule;
