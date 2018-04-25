pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/CappedToken.sol';

contract SpokkzToken is CappedToken {
  string public name = "Spokkz Token";
  string public symbol = "SPOKKZ";
  uint8 public decimals = 18;

  function SpokkzToken(uint256 _capTokenSupply) public CappedToken(_capTokenSupply) {
  }
}
