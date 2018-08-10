pragma solidity ^0.4.24;

import './SpokkzToken.sol';

import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/TokenVesting.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol';

contract SpokkzTokenSale is CappedCrowdsale, RefundableCrowdsale, MintedCrowdsale, WhitelistedCrowdsale {

  event TokenVestingCreated(address indexed beneficiary, address indexed tokenVesting, uint256 vestingStartDate, uint256 vestingCliffDuration, uint256 vestingPeriodDuration, uint256 vestingFullAmount);
  event TokenTimelockCreated(address indexed beneficiary, address indexed tokenTimelock, uint256 releaseTime);

  event Start();
  event Pause();
  event Unpause();

  enum TokenSaleStage {
    Private,
    Presale,
    Crowdsale
  }

  uint constant public numberOFStages = 3;

  mapping (uint256 => uint256) public ratePerStage;
  mapping (uint256 => uint256) public totalTokensForSalePerStage;

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
  address public otherFunds;

  uint256 public raisedPrivatelyPreDeployment;
  uint256 public totalTokensSoldPrivatelyPreDeployment;

  bool public hasStarted = false;
  bool public isPaused = false;

  // Constructor
  // ============
  constructor (
      uint256 _rateDuringPrivateStage,
      uint256 _rateDuringPresaleStage,
      uint256 _rateDuringCrowdsaleStage,
      uint256 _raisedPrivatelyPreDeployment,
      address _wallet,
      ERC20 _token,
      uint256 _goal,
      uint256 _cap,
      uint256 _openingTime,
      uint256 _closingTime,
      address _ecosystemFund,
      address _otherFunds) public
    CappedCrowdsale(_cap)
    RefundableCrowdsale(_goal)
    TimedCrowdsale(_openingTime, _closingTime)
    Crowdsale(_rateDuringPrivateStage, _wallet, _token)
    {
      require(_rateDuringPrivateStage > 0);
      require(_rateDuringPresaleStage > 0);
      require(_rateDuringCrowdsaleStage > 0);
      require(_ecosystemFund != 0);
      require(_otherFunds != 0);

      ratePerStage[uint256(TokenSaleStage.Private)] = _rateDuringPrivateStage;
      ratePerStage[uint256(TokenSaleStage.Presale)] = _rateDuringPresaleStage;
      ratePerStage[uint256(TokenSaleStage.Crowdsale)] = _rateDuringCrowdsaleStage;

      totalTokensForSalePerStage[uint256(TokenSaleStage.Private)] = totalTokensForSaleDuringPrivateStage;
      totalTokensForSalePerStage[uint256(TokenSaleStage.Presale)]  = totalTokensForSaleDuringPresaleStage;
      totalTokensForSalePerStage[uint256(TokenSaleStage.Crowdsale)] = totalTokensForSaleDuringCrowdsaleStage;

      ecosystemFund = _ecosystemFund;
      otherFunds = _otherFunds;

      raisedPrivatelyPreDeployment = _raisedPrivatelyPreDeployment;
    }
  // =============

  modifier whenNotPaused() {
    require(hasStarted);
    require(!isPaused);
    _;
  }

  modifier whenPaused() {
    require(hasStarted);
    require(isPaused);
    _;
  }

  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) whenNotPaused internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);

    uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(rate);
    uint256 totalTokensThatWillBeMintedAfterPurchase = tokensThatWillBeMintedAfterPurchase.add(token.totalSupply());

    require(totalTokensForSale >= totalTokensThatWillBeMintedAfterPurchase);

    if (stage == TokenSaleStage.Private) {
      require(totalTokensForSalePerStage[uint256(TokenSaleStage.Private)] >= totalTokensThatWillBeMintedAfterPurchase);
    }
  }

  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    address beneficiary;
    uint256 releaseTime;

    if (stage == TokenSaleStage.Private) {
      releaseTime = closingTime.add(180 days);

      TokenTimelock privateTokenTimelock = new TokenTimelock(token, _beneficiary, releaseTime);
      emit TokenTimelockCreated(_beneficiary, privateTokenTimelock, releaseTime);

      beneficiary = privateTokenTimelock;
    } else if (stage == TokenSaleStage.Presale){

      uint256 vestingStartDate = closingTime.add(7 days);
      uint256 vestingCliffDuration = 0;
      uint256 vestingPeriodDuration = 180 days;
      bool vestingRevocable = true;

      TokenVesting tokenVesting = new TokenVesting(_beneficiary, vestingStartDate, vestingCliffDuration, vestingPeriodDuration, vestingRevocable);
      emit TokenVestingCreated(_beneficiary, tokenVesting, vestingStartDate, vestingCliffDuration, vestingPeriodDuration, _tokenAmount);

      beneficiary = tokenVesting;
    } else if (stage == TokenSaleStage.Crowdsale) {
      releaseTime = closingTime.add(7 days);

      TokenTimelock crowdsaleTokenTimelock = new TokenTimelock(token, _beneficiary, releaseTime);
      emit TokenTimelockCreated(_beneficiary, crowdsaleTokenTimelock, releaseTime);

      beneficiary = crowdsaleTokenTimelock;
    }

    _deliverTokens(beneficiary, _tokenAmount);
  }

  function startNextSaleStage() public onlyOwner whenNotPaused {
    require(stage != TokenSaleStage.Crowdsale);

    if (stage == TokenSaleStage.Private) {
      stage = TokenSaleStage.Presale;
    } else if (stage == TokenSaleStage.Presale) {
      stage = TokenSaleStage.Crowdsale;
    }

    rate = ratePerStage[uint256(stage)];
  }

  function mintTokensSoldPrivatelyPreDeployment() private {
    require(!hasStarted);

   if (raisedPrivatelyPreDeployment > 0) {
      uint256 weiAmount = raisedPrivatelyPreDeployment;
      uint256 tokenAmount = weiAmount.mul(ratePerStage[uint256(TokenSaleStage.Private)]);

      weiRaised = weiRaised.add(weiAmount);
      _deliverTokens(otherFunds, tokenAmount);
    }
  }

  function finalization() internal {
    super.finalization();

    uint256 alreadyMinted = token.totalSupply();
    uint256 unsoldTokens = totalTokensForSale.sub(alreadyMinted);

    uint256 tokensForEcosystemPlusUnsoldTokens = tokensForEcosystem.add(unsoldTokens);

    _deliverTokens(ecosystemFund, tokensForEcosystemPlusUnsoldTokens);

    uint256 remainingTokensToBeMinted = tokensForTeam.add(tokensForAdvisors).add(tokensForLegalAndMarketing).add(tokensForBounty);
    _deliverTokens(otherFunds, remainingTokensToBeMinted);
  }

  function extendClosingTime() onlyOwner public {
    require(!isFinalized);
    closingTime = closingTime.add(1 days);
  }

  function start() public onlyOwner {
    require(!hasStarted);

    mintTokensSoldPrivatelyPreDeployment();
    hasStarted = true;
    emit Start();
  }

  function pause() onlyOwner whenNotPaused public {
    isPaused = true;
    emit Pause();
  }

  function unpause() onlyOwner whenPaused public {
    isPaused = false;
    emit Unpause();
  }
}
