var SpokToken = artifacts.require("./SpokToken.sol");
var SpokTokenSale = artifacts.require("./SpokTokenSale")

module.exports = function(deployer, network, accounts) {
  const preIcoRate = 8870;
  const wallet = accounts[9];
  const cap = 26260000000000000000000; // 26, 260 ethers

  deployer.deploy(SpokToken ).then(function() {
    return deployer.deploy(SpokTokenSale, preIcoRate, wallet, SpokToken.address, cap).then(function() {
      return SpokToken.deployed().then(function(spokToken) {
        return spokToken.transferOwnership(SpokTokenSale.address);
      });
    });
  })
};
