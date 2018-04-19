pragma solidity ^0.4.18;

import './SpokToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';

contract SpokTokenSale is CappedCrowdsale {

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
  uint256 public maxSupplyOfTokens            =  1000000000 * (10 ** uint256(18));  // total supply is 1 billion of tokens

  uint256 public tokensForEcosystem           = 430000000 * (10 ** uint256(18));    // tokens for Ecosystem is 430 million, 43% of token supply
  uint256 public totalTokensForSale           = 300000000 * (10 ** uint256(18));    // tokens for sale is 300 million, 30% of the total supply
  uint256 public tokensForTeam                = 140000000 * (10 ** uint256(18));    // tokens for Team is 140 million, 14% of token supply
  uint256 public tokensForAdvisors            = 60000000 * (10 ** uint256(18));     // tokens for Advisors is 60 million, 6% of token supply
  uint256 public tokensForLegalAndMarketing   = 60000000 * (10 ** uint256(18));     // tokens for Legal And Marketing is 60 million, 6% of token supply
  uint256 public tokensForBounty              = 10000000 * (10 ** uint256(18));     // tokens for Bounty is 10 million, 1% of token supply

  uint256 public totalTokensForSaleDuringPrivateStage   = 45000000 * (10 ** uint256(18));   // tokens for sale on Private stage is 45 million, 15% of total tokens for sale, 4.5% of token supply
  uint256 public totalTokensForSaleDuringPreICOStage    = 210000000 * (10 ** uint256(18));  // tokens for sale on PreICO stage is 210 million, 70% of total tokens for sale, 21% of token supply
  uint256 public totalTokensForSaleDuringICOStage       = 45000000 * (10 ** uint256(18));   // tokens for sale on ICO stage is  45 million, 15% of total tokens for sale, 4.5% of token supply

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
}
