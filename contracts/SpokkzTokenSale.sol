pragma solidity ^0.4.18;

import './SpokkzToken.sol';

import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol';

contract SpokkzTokenSale is CappedCrowdsale, MintedCrowdsale, WhitelistedCrowdsale, FinalizableCrowdsale {

  enum TokenSaleStage {
    Private,
    Presale,
    Crowdsale
  }

  uint constant numberOFStages = 3;


  mapping (uint256 => uint256) public ratePerStage;
  mapping (uint256 => uint256) public totalTokensForSalePerStage;
  /* mapping (uint256 => uint256) public totalWeiRaisedPerStage; */

  TokenSaleStage public stage = TokenSaleStage.Private;

  // Token Distribution
  // ==================
  uint256 public maxSupplyOfTokens            =  1000000000 * (10 ** uint256(18));  // total supply is 1 billion of tokens

  uint256 public tokensForEcosystem           = 430000000 * (10 ** uint256(18));    // tokens for Ecosystem is 430 million, 43% of token supply
  uint256 public totalTokensForSale           = 300000000 * (10 ** uint256(18));    // tokens for sale is 300 million, 30% of the total supply
  uint256 public tokensForTeam                = 140000000 * (10 ** uint256(18));    // tokens for Team is 140 million, 14% of token supply
  uint256 public tokensForAdvisors            = 60000000 * (10 ** uint256(18));     // tokens for Advisors is 60 million, 6% of token supply
  uint256 public tokensForLegalAndMarketing   = 60000000 * (10 ** uint256(18));     // tokens for Legal And Marketing is 60 million, 6% of token supply
  uint256 public tokensForBounty              = 10000000 * (10 ** uint256(18));     // tokens for Bounty is 10 million, 1% of token supply

  uint256 public totalTokensForSaleDuringPrivateStage   = 45000000 * (10 ** uint256(18));   // tokens for sale on Private stage is 45 million, 15% of total tokens for sale, 4.5% of token supply
  uint256 public totalTokensForSaleDuringPresaleStage   = 210000000 * (10 ** uint256(18));  // tokens for sale on Presale stage is 210 million, 70% of total tokens for sale, 21% of token supply
  uint256 public totalTokensForSaleDuringCrowdsaleStage = 45000000 * (10 ** uint256(18));   // tokens for sale on Crowdsale stage is  45 million, 15% of total tokens for sale, 4.5% of token supply

  address public ecosystemFund;
  address public unsoldTokensForDistribution;
  address public otherFunds;


  // Events
  event EthTransferred(string text);
  event EthRefunded(string text);

  // Constructor
  // ============
  function SpokkzTokenSale(
      uint256 _rateDuringPrivateStage,
      uint256 _rateDuringPresaleStage,
      uint256 _rateDuringCrowdsaleStage,
      address _wallet,
      ERC20 _token,
      uint256 _cap, uint256
      _openingTime, uint256
      _closingTime,
      address _ecosystemFund,
      address _unsoldTokensForDistribution,
      address _otherFunds) public
    CappedCrowdsale(_cap)
    Crowdsale(_rateDuringPrivateStage, _wallet, _token)
    TimedCrowdsale(_openingTime, _closingTime)
    {
      require(_rateDuringPrivateStage > 0);
      require(_rateDuringPresaleStage > 0);
      require(_rateDuringCrowdsaleStage > 0);
      require(_ecosystemFund != 0);
      require(_unsoldTokensForDistribution != 0);
      require(_otherFunds != 0);

      ratePerStage[uint256(TokenSaleStage.Private)] = _rateDuringPrivateStage;
      ratePerStage[uint256(TokenSaleStage.Presale)] = _rateDuringPresaleStage;
      ratePerStage[uint256(TokenSaleStage.Crowdsale)] = _rateDuringCrowdsaleStage;

      totalTokensForSalePerStage[uint256(TokenSaleStage.Private)] = totalTokensForSaleDuringPrivateStage;
      totalTokensForSalePerStage[uint256(TokenSaleStage.Presale)]  = totalTokensForSaleDuringPresaleStage;
      totalTokensForSalePerStage[uint256(TokenSaleStage.Crowdsale)] = totalTokensForSaleDuringCrowdsaleStage;

      ecosystemFund = _ecosystemFund;
      unsoldTokensForDistribution = _unsoldTokensForDistribution;
      otherFunds = _otherFunds;

      /* totalWeiRaisedPerStage[uint256(TokenSaleStage.Private)] = 0;
      totalWeiRaisedPerStage[uint256(TokenSaleStage.Presale)] = 0;
      totalWeiRaisedPerStage[uint256(TokenSaleStage.Crowdsale)] = 0; */

    }
  // =============
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);

    uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(rate);
    uint256 totalTokensThatWillBeMintedAfterPurchase = tokensThatWillBeMintedAfterPurchase + token.totalSupply();

    require(totalTokensForSale >= totalTokensThatWillBeMintedAfterPurchase);

    if (stage == TokenSaleStage.Private) {
      require(totalTokensForSalePerStage[uint256(TokenSaleStage.Private)] >= totalTokensThatWillBeMintedAfterPurchase);
    }
  }

  function startNextSaleStage() public onlyOwner {
    require(stage != TokenSaleStage.Crowdsale);

    if (stage == TokenSaleStage.Private) {
      stage = TokenSaleStage.Presale;
    } else if (stage == TokenSaleStage.Presale) {
      stage = TokenSaleStage.Crowdsale;
    }

    rate = ratePerStage[uint256(stage)];
  }

  function finalization() internal {
    super.finalization();
    
    uint256 alreadyMinted = token.totalSupply();

    _deliverTokens(ecosystemFund, tokensForEcosystem);

    uint256 unsoldTokens = totalTokensForSale - alreadyMinted;
    if(unsoldTokens > 0) {
      _deliverTokens(unsoldTokensForDistribution, unsoldTokens);
    }

    uint256 remainingTokensToBeMinted = tokensForTeam + tokensForAdvisors + tokensForLegalAndMarketing + tokensForBounty;
    _deliverTokens(otherFunds, remainingTokensToBeMinted);
  }
}
