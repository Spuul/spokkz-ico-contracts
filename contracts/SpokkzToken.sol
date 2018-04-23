pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract SpokkzToken is MintableToken {
  string public name = "Spokkz Token";
  string public symbol = "SPOKKZ";
  uint8 public decimals = 18;
}
