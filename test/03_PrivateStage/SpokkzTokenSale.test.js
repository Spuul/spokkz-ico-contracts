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
const cap = ether(50000).dividedBy(scaleDownValue); // 500 ethers
const capTokenSupply = new BigNumber('1e27'); // 1 Billion
const raisedPrivatelyPreDeployment = new BigNumber(0);

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokkzTokenSale', function ([_, wallet, purchaser, investorA, investorB, investorC, ecosystemFund, unsoldTokensForDistribution, otherFunds]) {
  describe('Private Stage', function () {

    describe('Within private token supply reserve', function () {
      const preWalletBalance = web3.eth.getBalance(wallet);

      before(async function () {
        await advanceBlock();

        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, cap, this.openingTime, this.closingTime, ecosystemFund, unsoldTokensForDistribution, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.start();
      });

      it('should reject transaction if not whitelisted ', async function () {
        await this.crowdsale.sendTransaction({ value: ether(1), from: investorA }).should.be.rejected;
      });

      it('should be successful transaction if whitelisted', async function () {
        let value = ether(1);

        await this.crowdsale.addToWhitelist(investorA);

        const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investorA }).should.be.fulfilled;

        const event = logs.find(e => e.event === 'TokenTimelockCreated');
        should.exist(event);

        let funderBalance = await this.token.balanceOf(investorA);
        funderBalance.should.be.bignumber.equal(0);

        let expectedTokenAmount = rateDuringPrivateStage.times(value);
        let tokenContractBalance = await this.token.balanceOf(event.args.tokenTimelock);
        tokenContractBalance.should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should forward funds to wallet', async function () {
        let value = ether(1);

        const pre = web3.eth.getBalance(wallet);
        await this.crowdsale.sendTransaction({ value, from: investorA });
        const post = web3.eth.getBalance(wallet);

        post.minus(pre).should.be.bignumber.equal(value);
      });

      it('should tally post wallet balance', async function () {
        const postWalletBalance = web3.eth.getBalance(wallet);
        postWalletBalance.should.be.bignumber.equal(preWalletBalance.plus(ether(2)));
      });
    });

    describe('Over private token supply reserve', function () {

      before(async function () {
        await advanceBlock();

        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, cap, this.openingTime, this.closingTime, ecosystemFund, unsoldTokensForDistribution, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.addToWhitelist(investorA);
        await this.crowdsale.start();
      });

      it('should be successful if within private token reserve', async function () {
        let value = ether(30);
        let expectedTokenAmount = rateDuringPrivateStage.times(value);
        await this.crowdsale.sendTransaction({ value: value, from: investorA }).should.be.fulfilled;
      });

      it('should be rejected if sold tokens is beyond private reserve', async function() {
        let value = ether(10);
        await this.crowdsale.sendTransaction({ value: value, from: investorA }).should.be.rejected;
      });

      it('should be successfull if sold tokens is equal to the private reserve', async function () {
        const totalTokensForSaleDuringPrivateStage = await this.crowdsale.totalTokensForSaleDuringPrivateStage.call();
        const totalTokensMintedSoFar = await this.token.totalSupply();

        const remainingTokensForPrivateStage = totalTokensForSaleDuringPrivateStage.minus(totalTokensMintedSoFar);
        const remainingTokenCostForPrivateStage = remainingTokensForPrivateStage.dividedBy(rateDuringPrivateStage);

        await this.crowdsale.sendTransaction({ value: remainingTokenCostForPrivateStage, from: investorA }).should.be.fulfilled;
      });
    });

    describe('Mink tokens sold pre-deployment', function () {

      beforeEach(async function () {
        await advanceBlock();

        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, ether(2), wallet, this.token.address, cap, this.openingTime, this.closingTime, ecosystemFund, unsoldTokensForDistribution, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.addToWhitelist(investorA);
      });

      it('should not be able to start if not owner', async function () {
        await this.crowdsale.start({ from: purchaser}).should.be.rejected;
        const hasStarted = await this.crowdsale.hasStarted.call();
        assert.isFalse(hasStarted);
      });

      it('should be able to start if owner', async function() {
        await this.crowdsale.start().should.be.fulfilled;
        const hasStarted = await this.crowdsale.hasStarted.call();
        assert.isTrue(hasStarted);
      });

      it('should be able to mint token sold pre deployment', async function() {
        await this.crowdsale.start().should.be.fulfilled;
        const hasStarted = await this.crowdsale.hasStarted.call();
        assert.isTrue(hasStarted);
      });
    });
  });
});
