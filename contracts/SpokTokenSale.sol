pragma solidity ^0.4.18;

import './SpokToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';

contract SpokTokenSale is CappedCrowdsale {

  enum TokenSaleStage { Private, PreICO, ICO }
  TokenSaleStage public stage = TokenSaleStage.Private;

  // Constructor
  // ============
  function SpokTokenSale(uint256 _rate, address _wallet, ERC20 _token, uint256 _cap) public
    CappedCrowdsale(_cap)
    Crowdsale(_rate, _wallet, _token)
    {}
  // =============

}
