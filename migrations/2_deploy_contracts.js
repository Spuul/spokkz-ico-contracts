var SpokkzToken = artifacts.require("./SpokkzToken.sol");
var SpokkzTokenSale = artifacts.require("./SpokkzTokenSale.sol")

module.exports = function(deployer, network, accounts) {

  const rateDuringPrivateStage = 12000;
  const rateDuringPresaleStage = 7058;
  const rateDuringCrowdsaleStage = 6000;

  const cap = 50000000000000000000000;                  // The cap is 50,000 Ethers
  const capTokenSupply = 1000000000000000000000000000;  // The cap token supply is 1 Billion SPOKKZ

  const wallet = accounts[9];

  deployer.deploy(SpokkzToken, capTokenSupply).then(function() {
    return deployer.deploy(
      SpokkzTokenSale, rateDuringPrivateStage, rateDuringPresaleStage, rateDuringCrowdsaleStage, wallet, SpokkzToken.address, cap).then(function() {
      return SpokkzToken.deployed().then(function(spokkzToken) {
        return spokkzToken.transferOwnership(SpokkzTokenSale.address);
      })
    });
  })

};
