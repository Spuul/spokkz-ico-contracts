pragma solidity ^0.4.18;

import './SpokToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';

contract SpokTokenSale is CappedCrowdsale, MintedCrowdsale {

  enum TokenSaleStage { PreICO, ICO }
  TokenSaleStage public stage = TokenSaleStage.PreICO;

  // 180,000,000 tokens out ouf 1,000,000,000 total supply
  uint256 public totalTokensForSaleDuringPreICO = 180000000 * (10 ** uint256(18));

  // Amount raised in PreICO
  uint256 public totalWeiRaisedDuringPreICO;

  // Events
  event EthTransferred(string text);
  event EthRefunded(string text);

  // Constructor
  // ============
  function SpokTokenSale(uint256 _rate, address _wallet, ERC20 _token, uint256 _cap) public
    CappedCrowdsale(_cap)
    Crowdsale(_rate, _wallet, _token)
    {}
  // =============

  // Token Purchase
  function() external payable {
    uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(rate);

    if ((stage == TokenSaleStage.PreICO) && ( token.totalSupply() + tokensThatWillBeMintedAfterPurchase > totalTokensForSaleDuringPreICO)) {
      msg.sender.transfer(msg.value); // Refund them
      EthRefunded("PreICO Limit Hit");
      return;
    }

    buyTokens(msg.sender);

    if (stage == TokenSaleStage.PreICO) {
        totalWeiRaisedDuringPreICO = totalWeiRaisedDuringPreICO.add(msg.value);
    }
  }

  // Get data for dashboard
  function getDashboardData() public view returns (TokenSaleStage _stage, uint256 _weiRaised, uint256 _cap) {
     return (stage, weiRaised, cap);
  }
}
