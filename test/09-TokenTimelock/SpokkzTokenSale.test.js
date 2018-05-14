import { advanceBlock } from '../../node_modules/zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from '../../node_modules/zeppelin-solidity/test/helpers/latestTime';
import EVMRevert from '../../node_modules/zeppelin-solidity/test/helpers/EVMRevert';
import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');
const TokenTimelock = artifacts.require('TokenTimelock');

const BigNumber = web3.BigNumber;

const scaleDownValue = 1000;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const goal = ether(11111).dividedBy(scaleDownValue);
const cap = ether(45000).dividedBy(scaleDownValue);

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

contract('SpokkzTokenSale', function ([_, owner, wallet, beneficiary, ecosystemFund, otherFunds]) {
  describe('Token timelock creation', function () {
    before(async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock();
    });

    beforeEach(async function () {
        this.openingTime = latestTime() + duration.minutes(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(
          rateDuringPrivateStage,
          rateDuringPresaleStage,
          rateDuringCrowdsaleStage,
          raisedPrivatelyPreDeployment,
          wallet,
          this.token.address,
          goal,
          cap,
          this.openingTime,
          this.closingTime,
          ecosystemFund,
          otherFunds,
           { from: owner });
        await this.token.transferOwnership(this.crowdsale.address);
        await this.crowdsale.start({from: owner});
      });

      it('token timelock should be created', async function () {
        await increaseTimeTo(this.openingTime);

        await this.crowdsale.startNextSaleStage({from: owner }); // presale
        await this.crowdsale.startNextSaleStage({from: owner }); // crowdsale

        await this.crowdsale.addToWhitelist(beneficiary, {from: owner});

        const { logs } = await this.crowdsale.sendTransaction({ value: ether(2), from: beneficiary });
        const event = logs.find(e => e.event === 'TokenTimelockCreated');

        should.exist(event);
      });
  });

  describe('Token timelock creation', function () {
    const amount = new BigNumber(100);

    before(async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock();
    });

    beforeEach(async function () {
      this.closingTime = latestTime() + duration.weeks(1);

      this.token = await SpokkzToken.new(capTokenSupply, { from: owner });
      this.releaseTime = this.closingTime + duration.days(7);

      this.timelock = await TokenTimelock.new(this.token.address, beneficiary, this.releaseTime);
      await this.token.mint(this.timelock.address, amount, { from: owner });
    });

    it('cannot be released before time limit', async function () {
      await this.timelock.release().should.be.rejected;
    });

    it('cannot be released just before time limit', async function () {
      await increaseTimeTo(this.releaseTime - duration.seconds(3));
      await this.timelock.release().should.be.rejected;
    });

    it('can be released just after limit', async function () {
      await increaseTimeTo(this.releaseTime + duration.seconds(1));
      await this.timelock.release().should.be.fulfilled;
      const balance = await this.token.balanceOf(beneficiary);
      balance.should.be.bignumber.equal(amount);
    });

    it('can be released after time limit', async function () {
      await increaseTimeTo(this.releaseTime + duration.years(1));
      await this.timelock.release().should.be.fulfilled;
      const balance = await this.token.balanceOf(beneficiary);
      balance.should.be.bignumber.equal(amount);
    });

    it('cannot be released twice', async function () {
      await increaseTimeTo(this.releaseTime + duration.years(1));
      await this.timelock.release().should.be.fulfilled;
      await this.timelock.release().should.be.rejected;
      const balance = await this.token.balanceOf(beneficiary);
      balance.should.be.bignumber.equal(amount);
    });
  });
});
