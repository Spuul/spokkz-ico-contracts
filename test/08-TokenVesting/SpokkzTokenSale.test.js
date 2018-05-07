import { advanceBlock } from '../../node_modules/zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from '../../node_modules/zeppelin-solidity/test/helpers/latestTime';
import EVMRevert from '../../node_modules/zeppelin-solidity/test/helpers/EVMRevert';
import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');
const TokenVesting = artifacts.require('TokenVesting');

const BigNumber = web3.BigNumber;

const scaleDownValue = 1000;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
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

contract('SpokkzTokenSale', function ([_, owner, wallet, beneficiary, ecosystemFund, unsoldTokensForDistribution, otherFunds]) {
  describe('Token vesting creation', function () {
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
          cap,
          this.openingTime,
          this.closingTime,
          ecosystemFund,
          unsoldTokensForDistribution,
          otherFunds,
           { from: owner });
        await this.token.transferOwnership(this.crowdsale.address);
        await this.crowdsale.start({ from: owner });
      });

      it('token vesting should be created', async function () {
        await increaseTimeTo(this.openingTime);

        await this.crowdsale.startNextSaleStage({from: owner }); // presale
        await this.crowdsale.addToWhitelist(beneficiary, {from: owner});

        const { logs } = await this.crowdsale.sendTransaction({ value: ether(2), from: beneficiary });
        const event = logs.find(e => e.event === 'TokenVestingCreated');

        should.exist(event);
      });
  });

  describe('Token vesting lifecycle', function () {

    before(async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock();
    });

    beforeEach(async function () {
      this.openingTime = latestTime() + duration.minutes(1);
      this.closingTime = this.openingTime + duration.weeks(1);
      this.afterClosingTime = this.closingTime + duration.seconds(1);
      this.token = await SpokkzToken.new(capTokenSupply, { from: owner });

      this.start = this.closingTime;
      this.cliff = 0;
      this.duration = duration.days(180)
      this.amount = new BigNumber(1000);


      this.vesting = await TokenVesting.new(beneficiary, this.start, this.cliff, this.duration, true, { from: owner });
      await this.token.mint(this.vesting.address, this.amount, { from: owner });
    });

    it('cannot be released before start', async function () {
      await this.vesting.release(this.token.address).should.be.rejectedWith(EVMRevert);
    });


    it('can be released after cliff', async function () {
      await increaseTimeTo(this.start + this.cliff + duration.days(1));
      await this.vesting.release(this.token.address).should.be.fulfilled;
    });


    it('should release proper amount after cliff', async function () {
      await increaseTimeTo(this.start + this.cliff + duration.days(1));

      const { receipt } = await this.vesting.release(this.token.address);
      const releaseTime = web3.eth.getBlock(receipt.blockNumber).timestamp;

      const balance = await this.token.balanceOf(beneficiary);
      balance.should.bignumber.equal(this.amount.mul(releaseTime - this.start).div(this.duration).floor());
    });

    it('should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.duration - this.cliff;
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start + this.cliff + i * (vestingPeriod / checkpoints);
        await increaseTimeTo(now);

        await this.vesting.release(this.token.address);
        const balance = await this.token.balanceOf(beneficiary);
        const expectedVesting = this.amount.mul(now - this.start).div(this.duration).floor();

        balance.should.bignumber.equal(expectedVesting);
      }
    });

    it('should have released all after end', async function () {
      await increaseTimeTo(this.start + this.duration);
      await this.vesting.release(this.token.address);
      const balance = await this.token.balanceOf(beneficiary);
      balance.should.bignumber.equal(this.amount);
    });

    it('should be revoked by owner if revocable is set', async function () {
      await this.vesting.revoke(this.token.address, { from: owner }).should.be.fulfilled;
    });

    it('should fail to be revoked by owner if revocable not set', async function () {
      const vesting = await TokenVesting.new(beneficiary, this.start, this.cliff, this.duration, false, { from: owner });
      await vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMRevert);
    });

    it('should return the non-vested tokens when revoked by owner', async function () {
      await increaseTimeTo(this.start + this.cliff + duration.weeks(12));

      const vested = await this.vesting.vestedAmount(this.token.address);
      await this.vesting.revoke(this.token.address, { from: owner });

      const ownerBalance = await this.token.balanceOf(owner);
      ownerBalance.should.bignumber.equal(this.amount.sub(vested));
    });

    it('should keep the vested tokens when revoked by owner', async function () {
      await increaseTimeTo(this.start + this.cliff + duration.weeks(12));

      const vestedPre = await this.vesting.vestedAmount(this.token.address);
      await this.vesting.revoke(this.token.address, { from: owner });

      const vestedPost = await this.vesting.vestedAmount(this.token.address);
      vestedPre.should.bignumber.equal(vestedPost);
    });


    it('should fail to be revoked a second time', async function () {
      await increaseTimeTo(this.start + this.cliff + duration.weeks(12));

      await this.vesting.vestedAmount(this.token.address);
      await this.vesting.revoke(this.token.address, { from: owner });
      await this.vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMRevert);
    });

    });
});
