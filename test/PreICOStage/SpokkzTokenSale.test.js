import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');

const BigNumber = web3.BigNumber;

const scaleDownValue = 100;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const cap = new BigNumber(50000000000000000000000).dividedBy(scaleDownValue); // 500 ethers

const PRIVATE_STAGE = new BigNumber(0);
const PRESALE_STAGE = new BigNumber(1);
const CROWDSALE_STAGE = new BigNumber(2);

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokkzTokenSale', function ([_, wallet, investorA]) {
  describe('Presale stage', function () {
    describe('start Presale stage after private', function () {

      before(async function () {
        this.token = await SpokkzToken.new();
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, wallet, this.token.address, cap);
        await this.token.transferOwnership(this.crowdsale.address);
      });

      it('should not be able to start next sale if not owner', async function () {
        const preStage = await this.crowdsale.stage.call();
        preStage.should.be.bignumber.equal(PRIVATE_STAGE);
        this.crowdsale.startNextSaleStage({from: investorA}).should.be.rejected;

        const postStage = await this.crowdsale.stage.call();
        postStage.should.be.bignumber.equal(preStage);
      });

      it('should be able to start next sale if owner', async function() {
        const preStage = await this.crowdsale.stage.call();
        preStage.should.be.bignumber.equal(PRIVATE_STAGE);
        this.crowdsale.startNextSaleStage().should.be.fulfilled;

        const postStage = await this.crowdsale.stage.call();
        postStage.should.be.bignumber.equal(PRESALE_STAGE);
      });
    });
  });
});
