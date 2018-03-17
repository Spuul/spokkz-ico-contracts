pragma solidity ^0.4.18;

import './SpokToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';

contract SpokTokenSale is CappedCrowdsale, MintedCrowdsale, WhitelistedCrowdsale, RefundableCrowdsale {

  enum TokenSaleStage {
    Private,
    PreICO,
    ICO
  }

  uint constant numberOFStages = 3;

  mapping (uint256 => uint256) public ratePerStage;
  mapping (uint256 => uint256) public totalTokensForSalePerStage;
  mapping (uint256 => uint256) public totalWeiRaisedPerStage;

  TokenSaleStage public stage = TokenSaleStage.Private;


  // Token Distribution
  // ==================
  uint256 public maxSupplyOfTokens  =  1000000000 * (10 ** uint256(18));  // total supply is 1 billion of tokens

  uint256 public tokensForEcosystem = 450000000 * (10 ** uint256(18));  // tokens for Ecosystem is 450 million, 45% of token supply;
  uint256 public tokensForTeam      = 200000000 * (10 ** uint256(18));  // tokens for Team is 200 million, 20% of token supply;
  uint256 public tokensForBounty    = 50000000 * (10 ** uint256(18));   // tokens for Bounty is 200 million, 20% of token supply;
  uint256 public totalTokensForSale =  300000000 * (10 ** uint256(18));   // tokens for sale is 300 million, 30% of the total supply

  uint256 public totalTokensForSaleDuringPrivateStage   = 45000000 * (10 ** uint256(18));   // tokens for sale on Private stage is 45 million, 15% of total tokens for sale, 4.5% of token supply
  uint256 public totalTokensForSaleDuringPreICOStage    = 210000000 * (10 ** uint256(18));  // tokens for sale on PreICO stage is 210 million, 70% of total tokens for sale, 21% of token supply
  uint256 public totalTokensForSaleDuringICOStage       = 45000000 * (10 ** uint256(18));   // tokens for sale on ICO stage is  45 million, 15% of total tokens for sale, 4.5% of token supply



  // Events
  event EthTransferred(string text);
  event EthRefunded(string text);

  // Constructor
  // ============
  function SpokTokenSale(uint256 _rateDuringPrivateStage, uint256 _rateDuringPreICOStage, uint256 _rateDuringICOStage, address _wallet, ERC20 _token, uint256 _cap, uint256 _goal, uint256 _openingTime, uint256 _closingTime) public
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
    Crowdsale(_rateDuringPrivateStage, _wallet, _token)
    {
      require(_rateDuringPrivateStage > 0);
      require(_rateDuringPreICOStage > 0);
      require(_rateDuringICOStage > 0);

      ratePerStage[uint256(TokenSaleStage.Private)] = _rateDuringPrivateStage;
      ratePerStage[uint256(TokenSaleStage.PreICO)] = _rateDuringPreICOStage;
      ratePerStage[uint256(TokenSaleStage.ICO)] = _rateDuringICOStage;

      totalTokensForSalePerStage[uint256(TokenSaleStage.Private)] = totalTokensForSaleDuringPrivateStage;
      totalTokensForSalePerStage[uint256(TokenSaleStage.PreICO)]  = totalTokensForSaleDuringPreICOStage;
      totalTokensForSalePerStage[uint256(TokenSaleStage.ICO)]     = totalTokensForSaleDuringICOStage;

      totalWeiRaisedPerStage[uint256(TokenSaleStage.Private)] = 0;
      totalWeiRaisedPerStage[uint256(TokenSaleStage.PreICO)] = 0;
      totalWeiRaisedPerStage[uint256(TokenSaleStage.ICO)] = 0;

    }
  // =============

  // Token Purchase
  function() external payable {
    uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(rate);
    uint256 totalSupplyAfterPurchase = token.totalSupply() + tokensThatWillBeMintedAfterPurchase;

    require(!tokenLimitOfCurrentStageIsReached(totalSupplyAfterPurchase));
    buyTokens(msg.sender);

    totalWeiRaisedPerStage[uint256(stage)] = totalWeiRaisedPerStage[uint256(stage)].add(msg.value);
  }

  function startNextSaleStage() public onlyOwner {
    require(stage != TokenSaleStage.ICO;);

    if (stage == TokenSaleStage.Private) {
      stage = TokenSaleStage.PreICO;
    } else if (stage == TokenSaleStage.PreICO) {
      stage = TokenSaleStage.ICO;
    }

    rate = ratePerStage[uint256(stage)];
  }

  function finish(address _teamFund, address _ecosystemFund, address _bountyFund) public onlyOwner {

      require(!isFinalized);
      uint256 alreadyMinted = token.totalSupply();
      require(alreadyMinted < maxSupplyOfTokens);

      uint256 unsoldTokens = totalTokensForSale - alreadyMinted;

      if (unsoldTokens > 0) {
        tokensForEcosystem = tokensForEcosystem + unsoldTokens;
      }

      token.mint(_teamFund,tokensForTeam);
      token.mint(_ecosystemFund,tokensForEcosystem);
      token.mint(_bountyFund,tokensForBounty);
      finalize();
  }

  function getTokenSaleData() public view returns (
    TokenSaleStage _stage,
    uint256 _weiRaised,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _time) {

      uint256 time = now;
      return (
        stage,
        weiRaised,
        cap,
        goal,
        openingTime,
        closingTime,
        time
     );
  }

  function getTokenSaleDataByStage(uint256 _stageNumber) public view returns (
    uint256 _rateInStage,
    uint256 _tokensForSaleInStage,
    uint256 _weiRaisedInStage) {

      require(_stageNumber < numberOFStages);

      uint256 rateInStage = ratePerStage[_stageNumber];
      uint256 tokensForSaleInStage = totalTokensForSalePerStage[_stageNumber];
      uint256 weiRaisedInStage = totalWeiRaisedPerStage[_stageNumber];

      return (rateInStage, tokensForSaleInStage, weiRaisedInStage);
  }


  function tokenLimitOfCurrentStageIsReached(uint256 tokenNumber) public view returns (bool) {
    bool result = (tokenNumber > totalTokensForSalePerStage[uint256(stage)]);
    return result;
  }

 // TODO: REMOVE THIS FUNCTION ONCE YOU ARE READY FOR PRODUCTION
 // USEFUL FOR TESTING `finish()` FUNCTION

function hasEnded() public view onlyOwner returns (bool) {
   return true;
 }
}
