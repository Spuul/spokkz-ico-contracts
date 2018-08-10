import { advanceBlock } from '../../node_modules/openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/openzeppelin-solidity/test/helpers/increaseTime';
import ether from '../../node_modules/openzeppelin-solidity/test/helpers/ether';
import latestTime from '../../node_modules/openzeppelin-solidity/test/helpers/latestTime';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');
const RefundVault = artifacts.require('RefundVault');

const BigNumber = web3.BigNumber;

const scaleDownValue = 1000;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const goal = ether(11111).dividedBy(scaleDownValue); // 11.111 ethers
const cap = ether(50000).dividedBy(scaleDownValue); // 50 ethers

const capTokenSupply = new BigNumber('1e27');        // 1 billion tokens
const TOTAL_TOKENS_FOR_SALE = new BigNumber('3e26'); // 300 million tokens 300 000 000

const PRIVATE_STAGE = new BigNumber(0);
const PRESALE_STAGE = new BigNumber(1);
const CROWDSALE_STAGE = new BigNumber(2);

const raisedPrivatelyPreDeployment = new BigNumber(0);

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokkzTokenSale', function ([_, wallet, investorA, investorB, investorC, investorD, ecosystemFund, otherFunds]) {
  describe('Soft cap is not reached', function () {
      before(async function () {
        await advanceBlock();
        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, goal, cap, this.openingTime, this.closingTime, ecosystemFund, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        this.vaultAddress = await this.crowdsale.vault.call();
        this.vault = RefundVault.at(this.vaultAddress);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.start();

        let value = ether(1);
        await this.crowdsale.addToWhitelist(investorA);
        this.crowdsale.sendTransaction({ value: value, from: investorA });
      });

      it('should deny refunds before end', async function () {
        await this.crowdsale.claimRefund({ from: investorA }).should.be.rejected;
      });

      it('should deny refunds when crowdsale has not finaled yet', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.claimRefund({ from: investorA }).should.be.rejected;
      });

      it('should allow refund after finalized if goal is not reached', async function () {
        await this.crowdsale.finalize();
        await this.crowdsale.claimRefund({ from: investorA }).should.be.fulfilled;
      });
    });

  describe('Soft cap is reached', function () {
      const pre = web3.eth.getBalance(wallet);

      before(async function () {
        await advanceBlock();
        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, goal, cap, this.openingTime, this.closingTime, ecosystemFund, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        this.vaultAddress = await this.crowdsale.vault.call();
        this.vault = RefundVault.at(this.vaultAddress);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.start();

        await this.crowdsale.startNextSaleStage();

        await this.crowdsale.addToWhitelist(investorA);
        await this.crowdsale.sendTransaction({ value: goal, from: investorA });
      });

      it('should deny refunds if goal was reached', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize();
        await this.crowdsale.claimRefund({ from: investorA }).should.be.rejected;
      });

      it('should forward funds to wallet after end if goal was reached', async function () {
        const post = web3.eth.getBalance(wallet);
        post.minus(pre).should.be.bignumber.equal(goal);
      });
    });
});
