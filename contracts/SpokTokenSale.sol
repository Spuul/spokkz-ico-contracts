pragma solidity ^0.4.18;

import './SpokToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';

contract SpokTokenSale is CappedCrowdsale, MintedCrowdsale {

  enum TokenSaleStage {
    Private,
    PreICO,
    ICO
  }

  TokenSaleStage public stage = TokenSaleStage.Private;

  // Token Distribution
  // ==================
  uint256 public totalSupplyOfTokens  =  1000000000 * (10 ** uint256(18));  // total supply is 1 billion of tokens
  uint256 public totalTokensForSale   =  300000000 * (10 ** uint256(18));   // tokens for sale is 300 million, 30% of the total supply

  uint256 public totalTokensForSaleDuringPrivateStage   = 45000000 * (10 ** uint256(18));   // tokens for sale on Private stage is 45 million, 15% of total tokens for sale
  uint256 public totalTokensForSaleDuringPreICOStage    = 210000000 * (10 ** uint256(18));  // tokens for sale on PreICO stage is 210 million, 70% of total tokens for sale
  uint256 public totalTokensForSaleDuringICOStage       = 45000000 * (10 ** uint256(18));   // tokens for sale on ICO stage is  45 million, 15% of total tokens for sale
  // ==================

  // Amount raised in each token sale stage
  // ==================
  uint256 public totalWeiRaisedDuringPrivateStage;
  uint256 public totalWeiRaisedDuringPreICOStage;
  uint256 public totalWeiRaisedDuringICOStage;
  // ==================


  // Rates on each stage
  // ==================
  uint256 public rateDuringPrivateStage = 20000;  // 1 ETH will get 20 thousand tokens, about 50% discount
  uint256 public rateDuringPreICOStage  = 11764;  // 1 ETH will get 11765 tokens, about 15% discount
  uint256 public rateDuringICOStage     = 10000;  // 1 ETH will get 10 thousand tokens, no discount
  // ==================

  // Events
  event EthTransferred(string text);
  event EthRefunded(string text);

  // Constructor
  // ============
  function SpokTokenSale(uint256 _rateDuringPrivateStage, uint256 _rateDuringPreICOStage, uint256 _rateDuringICOStage, address _wallet, ERC20 _token, uint256 _cap) public
    CappedCrowdsale(_cap)
    Crowdsale(_rateDuringPrivateStage, _wallet, _token)
    {
      require(_rateDuringPrivateStage > 0);
      require(_rateDuringPreICOStage > 0);
      require(_rateDuringICOStage > 0);

      rateDuringPrivateStage  = _rateDuringPrivateStage;
      rateDuringPreICOStage   = _rateDuringPreICOStage;
      rateDuringICOStage      = _rateDuringICOStage;
    }
  // =============

  // Token Purchase
  function() external payable {
    uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(rate);

    if ((stage == TokenSaleStage.PreICO) && ( token.totalSupply() + tokensThatWillBeMintedAfterPurchase > totalTokensForSaleDuringPreICOStage)) {
      msg.sender.transfer(msg.value); // Refund them
      EthRefunded("PreICO Limit Hit");
      return;
    }

    buyTokens(msg.sender);

    if (stage == TokenSaleStage.PreICO) {
        totalWeiRaisedDuringPreICOStage = totalWeiRaisedDuringPreICOStage.add(msg.value);
    }
  }

  // Get data for dashboard
  function getDashboardData() public view returns (TokenSaleStage _stage, uint256 _rate, uint256 _weiRaised, uint256 _cap, uint256 _rateDuringPrivateStage, uint256 _rateDuringPreICOStage, uint256 _rateDuringICOStage) {
     return (stage, rate, weiRaised, cap, rateDuringPrivateStage, rateDuringPreICOStage, rateDuringICOStage);
  }

  /* function isOwner() public view returns (bool _senderIsOwner) {
    bool senderIsOwner = false;
    senderIsOwner = (msg.sender == owner);
    return senderIsOwner;
  } */
}
