var SpokToken = artifacts.require("./SpokToken.sol");
var SpokTokenSale = artifacts.require("./SpokTokenSale.sol")

module.exports = function(deployer, network, accounts) {

  // Testing Parameters
  // ==================
  // INFO: Commented out the TimedCrowdsale require(_openingTime >= now) for easy testing.
  const openingTime = Math.round((new Date(Date.now() - 86400000).getTime()) / 1000); // Yesterday
  const closingTime = Math.round((new Date().getTime() + (86400000 * 70)) / 1000); // Today + 70 days

  const rateDuringPrivateStage = 2000000; // 1 ETH will get 2 million tokens, about 50% discount
  const rateDuringPreICOStage = 1176470; // 1 ETH will get 1176470 tokens, about 15% discount
  const rateDuringICOStage = 1000000; // 1 ETH will get 1 million tokens, no discount

  const goal = 5000000000000000000; // goal is 5 ethers
  const cap = 300000000000000000000; // cap is 300 ethers
  // ==================



  const wallet = accounts[9];


  deployer.deploy(SpokToken).then(function() {
    return deployer.deploy(
      SpokTokenSale, rateDuringPrivateStage, rateDuringPreICOStage, rateDuringICOStage, wallet, SpokToken.address, cap, goal, openingTime, closingTime).then(function() {
      return SpokToken.deployed().then(function(spokToken) {
        return spokToken.transferOwnership(SpokTokenSale.address);
      });
    });
  })
};