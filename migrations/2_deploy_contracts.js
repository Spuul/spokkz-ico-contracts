var SpokToken = artifacts.require("./SpokToken.sol");
var SpokTokenSale = artifacts.require("./SpokTokenSale.sol")

module.exports = function(deployer, network, accounts) {
  const rateDuringPrivateStage = 20000; // 1 ETH will get 20 thousand tokens, about 50% discount
  const rateDuringPreICOStage = 11764; // 1 ETH will get 11765 tokens, about 15% discount
  const rateDuringICOStage = 10000 // 1 ETH will get 10 thousand tokens, no discount

  const wallet = accounts[9];
  const cap = 30000000000000000000000; // cap is 30000 ethers

  deployer.deploy(SpokToken).then(function() {
    return deployer.deploy(
      SpokTokenSale, rateDuringPrivateStage, rateDuringPreICOStage, rateDuringICOStage, wallet, SpokToken.address, cap).then(function() {
      return SpokToken.deployed().then(function(spokToken) {
        return spokToken.transferOwnership(SpokTokenSale.address);
      });
    });
  })
};