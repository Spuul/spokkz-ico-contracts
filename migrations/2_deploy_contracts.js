var SpokkzToken = artifacts.require("./SpokkzToken.sol");
var SpokkzTokenSale = artifacts.require("./SpokkzTokenSale.sol")

module.exports = function(deployer, network, accounts) {

  const BigNumber = web3.BigNumber;
  const capTokenSupply = new BigNumber('1e27');         // 1 Billion

  const wallet = accounts[1]
  const ecosystemFund = accounts[2]
  const otherFunds = accounts[3] // teamFund, advisorsFund, legalAndMarketingFund, bountyFund, tokensAlreadySold

  let bufferForOpeningTime;
  let saleDuration;
  let openingTime;
  let closingTime;
  let goal;
  let cap;
  let raisedPrivatelyPreDeployment;

  let rateDuringPrivateStage;
  let rateDuringPresaleStage;
  let rateDuringCrowdsaleStage;

  if (network === "rinkeby") {
    bufferForOpeningTime = 60000 * 5; // 5 minutes
    saleDuration = 60000 * 60 * 3;    // 3 hours

    rateDuringPrivateStage = 12000 * 1000;
    rateDuringPresaleStage = 7058 * 1000 ;
    rateDuringCrowdsaleStage = 6000 * 1000;

    goal = 11111 / 1000; // 11.111 eth
    cap = 50000 / 1000;  // 50 eth

    raisedPrivatelyPreDeployment = 1;

  } else {
    bufferForOpeningTime = 60000 * 60;      // 1 hour
    saleDuration = 60000 * 60 * 24 * 30;    // 30 days

    rateDuringPrivateStage = 12000;
    rateDuringPresaleStage = 7058;
    rateDuringCrowdsaleStage = 6000;

    goal = 11111;
    cap = 50000;

    raisedPrivatelyPreDeployment = 0;
  }

  openingTime = Math.round((new Date(Date.now() + bufferForOpeningTime).getTime())/1000);
  closingTime = Math.round((new Date().getTime() + (saleDuration))/1000);

  goal = new BigNumber(web3.toWei(goal, 'ether'));
  cap = new BigNumber(web3.toWei(cap, 'ether'));

  raisedPrivatelyPreDeployment = new BigNumber(web3.toWei(raisedPrivatelyPreDeployment, 'ether'));

  deployer.deploy(SpokkzToken, capTokenSupply).then(function() {
    return deployer.deploy(
      SpokkzTokenSale,
      rateDuringPrivateStage,
      rateDuringPresaleStage,
      rateDuringCrowdsaleStage,
      raisedPrivatelyPreDeployment,
      wallet,
      SpokkzToken.address,
      goal,
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
