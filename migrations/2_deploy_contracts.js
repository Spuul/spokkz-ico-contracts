var SpokkzToken = artifacts.require("./SpokkzToken.sol");
var SpokkzTokenSale = artifacts.require("./SpokkzTokenSale.sol")

module.exports = function(deployer, network, accounts) {

  const BigNumber = web3.BigNumber;

  const additionalTime = 60000 * 5;
  const openingTime = Math.round((new Date(Date.now() + additionalTime).getTime())/1000);
  const closingTime = Math.round((new Date().getTime() + (86400000 * 30))/1000);          

  const rateDuringPrivateStage = 12000;
  const rateDuringPresaleStage = 7058;
  const rateDuringCrowdsaleStage = 6000;

  const cap = new BigNumber(web3.toWei(50000, 'ether')); // Hard cap is 50,000 ether
  const capTokenSupply = new BigNumber('1e27');         // 1 Billion

  const wallet = accounts[1]
  const ecosystemFund = accounts[2]
  const otherFunds = accounts[3] // teamFund, advisorsFund, legalAndMarketingFund, bountyFund, tokensAlreadySold

  const raisedPrivatelyPreDeployment = new BigNumber(web3.toWei(0, 'ether'));

  deployer.deploy(SpokkzToken, capTokenSupply).then(function() {
    return deployer.deploy(
      SpokkzTokenSale,
      rateDuringPrivateStage,
      rateDuringPresaleStage,
      rateDuringCrowdsaleStage,
      raisedPrivatelyPreDeployment,
      wallet,
      SpokkzToken.address,
      cap,
      openingTime,
      closingTime,
      ecosystemFund,
      otherFunds
    ).then(function() {
      return SpokkzToken.deployed().then(function(spokkzToken) {
        return spokkzToken.transferOwnership(SpokkzTokenSale.address);
      })
    });
  })
};
