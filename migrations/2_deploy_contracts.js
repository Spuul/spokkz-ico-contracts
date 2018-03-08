var SpokToken = artifacts.require("./SpokToken.sol");
var SpokTokenSale = artifacts.require("./SpokTokenSale")


module.exports = function(deployer, network, accounts) {
  const rate = 5
  const wallet = accounts[1]
  const cap = 500000000000000000000

  deployer.deploy(SpokToken ).then(function() {
    return deployer.deploy(SpokTokenSale, rate, wallet, SpokToken.address, cap).then(function() {
      return SpokToken.deployed().then(function(spokToken) {
        return spokToken.transferOwnership(SpokTokenSale.address);
      });
    });
  })
};
