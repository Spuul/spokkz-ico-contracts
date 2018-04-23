var SpokkzToken = artifacts.require("./SpokkzToken.sol");
var SpokkzTokenSale = artifacts.require("./SpokkzTokenSale.sol")

module.exports = function(deployer, network, accounts) {


  // INFO: Commented out the TimedCrowdsale require(_openingTime >= now) for easy testing.
  // const tokenSaleDays = 45;
  //
  // const openingTime = Math.round((new Date(Date.now() - 86400000).getTime()) / 1000);
  // const closingTime = Math.round((new Date().getTime() + (86400000 * tokenSaleDays)) / 1000);
  //
  const rateDuringPrivateStage = 12000;
  const rateDuringPreICOStage = 7058;
  const rateDuringICOStage = 6000;
  //
  // const goal = 11111000000000000000000;   // The goal is 11,111 Ethers
  const cap = 50000000000000000000000;    // The cap is 50,000 Ethers

  const wallet = accounts[9];

  deployer.deploy(SpokkzToken).then(function() {
    return deployer.deploy(
      SpokkzTokenSale, rateDuringPrivateStage, rateDuringPreICOStage, rateDuringICOStage, wallet, SpokkzToken.address, cap).then(function() {
      return SpokkzToken.deployed().then(function(spokkzToken) {
        return spokkzToken.transferOwnership(SpokkzTokenSale.address);
      })
    });
  })


  // deployer.deploy(SpokToken).then(function() {
  //   return deployer.deploy(
  //     SpokTokenSale, rateDuringPrivateStage, rateDuringPreICOStage, rateDuringICOStage, wallet, SpokToken.address, cap, goal, openingTime, closingTime).then(function() {
  //     return SpokToken.deployed().then(function(spokToken) {
  //       return spokToken.transferOwnership(SpokTokenSale.address);
  //     });
  //   });
  // })
};
