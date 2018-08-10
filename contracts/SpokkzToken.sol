pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol';

contract SpokkzToken is CappedToken {
  string public name = "Spokkz Token";
  string public symbol = "SPOKKZ";
  uint8 public decimals = 18;

  constructor(uint256 _capTokenSupply) public CappedToken(_capTokenSupply) {
  }
}
