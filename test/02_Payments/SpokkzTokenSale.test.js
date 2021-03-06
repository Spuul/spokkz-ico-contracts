import { advanceBlock } from '../../node_modules/zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/zeppelin-solidity/test/helpers/increaseTime';
import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';
import latestTime from '../../node_modules/zeppelin-solidity/test/helpers/latestTime';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');

const BigNumber = web3.BigNumber;

const scaleDownValue = 100;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const goal = ether(11111).dividedBy(scaleDownValue); // 11.111 ethers
const cap = ether(50000).dividedBy(scaleDownValue); // 500 ethers

const capTokenSupply = new BigNumber('1e27'); // 1 Billion
const raisedPrivatelyPreDeployment = new BigNumber(0);

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokkzTokenSale', function ([_, wallet, authorized, purchaser, unauthorized, ecosystemFund, otherFunds]) {

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.days(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await SpokkzToken.new(capTokenSupply);
    this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, goal, cap, this.openingTime, this.closingTime,ecosystemFund, otherFunds);
    await this.token.transferOwnership(this.crowdsale.address);

    await increaseTimeTo(this.openingTime);
    await this.crowdsale.addToWhitelist(authorized);

    await this.crowdsale.start();
  });

  describe('reporting whitelisted', function () {
    it('should correctly report whitelisted addresses', async function () {
      let isAuthorized = await this.crowdsale.whitelist(authorized);
      isAuthorized.should.equal(true);
      let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
      isntAuthorized.should.equal(false);
    });
  });

  describe('accepting payments', function () {
    let value = ether(1);

    it('should accept payments to whitelisted (from whichever buyers)', async function () {
      await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
      await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
    });

    it('should reject payments to not whitelisted (from whichever buyers)', async function () {
      await this.crowdsale.send(value).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
    });

    it('should reject payments to addresses removed from whitelist', async function () {
      await this.crowdsale.removeFromWhitelist(authorized);
      await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.rejected;
    });
  });

  describe('high-level purchase', function () {
    let value = ether(1);
    let expectedTokenAmount = rateDuringPrivateStage.times(value);

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: authorized });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);

      event.args.purchaser.should.equal(authorized);
      event.args.beneficiary.should.equal(authorized);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to vault', async function () {
      await this.crowdsale.sendTransaction({ value, from: authorized });

      const vaultAddress = await this.crowdsale.vault.call();
      const vaultBalance = web3.eth.getBalance(vaultAddress);

      vaultBalance.should.be.bignumber.equal(value);
    });
  });

  describe('low-level purchase', function () {
    let value = ether(1);
    let expectedTokenAmount = rateDuringPrivateStage.times(value);

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(authorized, { value: value, from: purchaser });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(authorized);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      await this.crowdsale.buyTokens(authorized, { value, from: purchaser });

      const vaultAddress = await this.crowdsale.vault.call();
      const vaultBalance = web3.eth.getBalance(vaultAddress);

      vaultBalance.should.be.bignumber.equal(value);
    });
  });
});
