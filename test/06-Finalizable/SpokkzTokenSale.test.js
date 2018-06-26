import { advanceBlock } from '../../node_modules/zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/zeppelin-solidity/test/helpers/increaseTime';
import latestTime from '../../node_modules/zeppelin-solidity/test/helpers/latestTime';
import EVMRevert from '../../node_modules/zeppelin-solidity/test/helpers/EVMRevert';
import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');

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

contract('SpokkzTokenSale', function ([_, owner, wallet, thirdparty, ecosystemFund, otherFunds]) {
  describe('Finalizing crowdsale', function () {
      before(async function () {
        // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
      });

      beforeEach(async function () {
        this.openingTime = latestTime() + duration.weeks(1);
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

      });

      it('cannot be finalized before ending', async function () {
        await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
      });

      it('cannot be finalized by third party after ending', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize({ from: thirdparty }).should.be.rejectedWith(EVMRevert);
      });

      it('can be finalized by owner after ending', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.extendClosingTime({ from: owner }).should.be.fulfilled;
      });

      it('should be able to extend closing time', async function()  {
        // not owner
        await this.crowdsale.extendClosingTime({ from: thirdparty }).should.be.rejectedWith(EVMRevert);

        await this.crowdsale.extendClosingTime({ from: owner }).should.be.fulfilled;
        const newClosingTime = await this.crowdsale.closingTime.call();

        const expectedClosingTime = new BigNumber(this.closingTime + duration.days(1));
        newClosingTime.should.be.bignumber.equal(expectedClosingTime);
      });

      it('cannot be finalized twice', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize({ from: owner });
        await this.crowdsale.finalize({ from: owner }).should.be.rejectedWith(EVMRevert);
      });

      it('logs finalized', async function () {
        await increaseTimeTo(this.afterClosingTime);
        const { logs } = await this.crowdsale.finalize({ from: owner });
        const event = logs.find(e => e.event === 'Finalized');
        should.exist(event);
      });

      it('should mint all tokens after finalizing', async function() {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.finalize({ from: owner }).should.be.fulfilled;
        const totalSupply = await this.token.totalSupply();
        totalSupply.should.be.bignumber.equal(capTokenSupply);
      }); 
    });
});
