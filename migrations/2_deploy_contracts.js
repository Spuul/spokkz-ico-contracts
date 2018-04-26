var SpokkzToken = artifacts.require("./SpokkzToken.sol");
var SpokkzTokenSale = artifacts.require("./SpokkzTokenSale.sol")

module.exports = function(deployer, network, accounts) {

  const additionalTime = 30000; // 30 seconds

  const openingTime = Math.round((new Date(Date.now() + additionalTime).getTime())/1000); // Now + 30 seconds
  const closingTime = Math.round((new Date().getTime() + (86400000 * 30))/1000);          // Today + 30 days

  const rateDuringPrivateStage = 12000;
  const rateDuringPresaleStage = 7058;
  const rateDuringCrowdsaleStage = 6000;

  const cap = 50000000000000000000000;  // The cap is 50,000 Ethers
  const capTokenSupply = 1000000000000000000000000000;  // The cap token supply is 1 Billion SPOKKZ

  const wallet = accounts[1]
  const ecosystemFund = accounts[2]
  const unsoldTokensForDistribution = accounts[3]
  const otherFunds = accounts[4] // teamFund, advisorsFund, legalAndMarketingFund, bountyFund

  deployer.deploy(SpokkzToken, capTokenSupply).then(function() {
    return deployer.deploy(
      SpokkzTokenSale,
      rateDuringPrivateStage,
      rateDuringPresaleStage,
      rateDuringCrowdsaleStage,
      wallet,
      SpokkzToken.address,
      cap,
      openingTime,
      closingTime,
      ecosystemFund,
      unsoldTokensForDistribution,
      otherFunds
    ).then(function() {
      return SpokkzToken.deployed().then(function(spokkzToken) {
        return spokkzToken.transferOwnership(SpokkzTokenSale.address);
      })
    });
  })

};
