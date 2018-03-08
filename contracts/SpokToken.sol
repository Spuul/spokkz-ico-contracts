pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract SpokToken is MintableToken {
  string public name = "Spok Token";
  string public symbol = "SPOK";
  uint8 public decimals = 18;
}
