pragma solidity ^0.4.18;

import './SpokToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';

contract SpokTokenSale is CappedCrowdsale, MintedCrowdsale, RefundableCrowdsale {

  enum TokenSaleStage {
    Private,
    PreICO,
    ICO
  }

  mapping (uint256 => uint256) public totalTokensForSalePerStage;
  mapping (uint256 => uint256) public totalWeiRaisedPerStage;

  TokenSaleStage public stage = TokenSaleStage.Private;


  // Token Distribution
  // ==================
  uint256 public maxSupplyOfTokens  =  1000000000 * (10 ** uint256(18));  // total supply is 1 billion of tokens
  uint256 public totalTokensForSale   =  300000000 * (10 ** uint256(18));   // tokens for sale is 300 million, 30% of the total supply

  uint256 public totalTokensForSaleDuringPrivateStage   = 45000000 * (10 ** uint256(18));   // tokens for sale on Private stage is 45 million, 15% of total tokens for sale
  uint256 public totalTokensForSaleDuringPreICOStage    = 210000000 * (10 ** uint256(18));  // tokens for sale on PreICO stage is 210 million, 70% of total tokens for sale
  uint256 public totalTokensForSaleDuringICOStage       = 45000000 * (10 ** uint256(18));   // tokens for sale on ICO stage is  45 million, 15% of total tokens for sale

  // Rates on each stage
  // ==================
  uint256 public rateDuringPrivateStage;
  uint256 public rateDuringPreICOStage;
  uint256 public rateDuringICOStage;
  // ==================

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

      rateDuringPrivateStage  = _rateDuringPrivateStage;
      rateDuringPreICOStage   = _rateDuringPreICOStage;
      rateDuringICOStage      = _rateDuringICOStage;

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

  // Get data for dashboard
  function getDashboardData() public view returns (
    TokenSaleStage _stage,
    uint256 _weiRaised,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _time)
    {
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

  function tokenLimitOfCurrentStageIsReached(uint256 tokenNumber) public view returns (bool) {
    bool result = (tokenNumber > totalTokensForSalePerStage[uint256(stage)]);
    return result;
  }
}
