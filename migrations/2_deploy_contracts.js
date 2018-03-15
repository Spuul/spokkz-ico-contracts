var SpokToken = artifacts.require("./SpokToken.sol");
var SpokTokenSale = artifacts.require("./SpokTokenSale.sol")

module.exports = function(deployer, network, accounts) {

  // Testing Parameters
  // ==================
  const rateDuringPrivateStage = 2000000; // 1 ETH will get 2 million tokens, about 50% discount
  const rateDuringPreICOStage = 1176470; // 1 ETH will get 1176470 tokens, about 15% discount
  const rateDuringICOStage = 1000000; // 1 ETH will get 1 million tokens, no discount

  const cap = 300000000000000000000; // cap is 300 ethers
  // ==================



  const wallet = accounts[9];


  deployer.deploy(SpokToken).then(function() {
    return deployer.deploy(
      SpokTokenSale, rateDuringPrivateStage, rateDuringPreICOStage, rateDuringICOStage, wallet, SpokToken.address, cap).then(function() {
      return SpokToken.deployed().then(function(spokToken) {
        return spokToken.transferOwnership(SpokTokenSale.address);
      });
    });
  })
};