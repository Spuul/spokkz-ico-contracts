import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');

const BigNumber = web3.BigNumber;

const scaleDownValue = 1000;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const cap = ether(50000).dividedBy(scaleDownValue); // 50 ethers

const capTokenSupply = new BigNumber('1e27');        // 1 billion tokens
const TOTAL_TOKENS_FOR_SALE = new BigNumber('3e26'); // 300 million tokens 300 000 000

const PRIVATE_STAGE = new BigNumber(0);
const PRESALE_STAGE = new BigNumber(1);
const CROWDSALE_STAGE = new BigNumber(2);

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokkzTokenSale', function ([_, wallet, investorA, investorB, investorC, investorD]) {
  describe('Public sale stage', function () {
    describe('Start crowdsale stage after presale', function () {

      const preWalletBalance = web3.eth.getBalance(wallet);

      before(async function () {
        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, wallet, this.token.address, cap);
        await this.token.transferOwnership(this.crowdsale.address);
      });

      it('should be able to start next sale if owner', async function() {
        const preStage = await this.crowdsale.stage.call();
        preStage.should.be.bignumber.equal(PRIVATE_STAGE);

        await this.crowdsale.startNextSaleStage().should.be.fulfilled;
        await this.crowdsale.startNextSaleStage().should.be.fulfilled;
        const postStage = await this.crowdsale.stage.call();
        postStage.should.be.bignumber.equal(CROWDSALE_STAGE);
      });

      it('should be successfull payment transaction', async function() {
        let value = ether(1);
        let expectedTokenAmount = rateDuringCrowdsaleStage.times(value);

        await this.crowdsale.addToWhitelist(investorA);

        await this.crowdsale.sendTransaction({ value: value, from: investorA }).should.be.fulfilled;
        let balance = await this.token.balanceOf(investorA);
        balance.should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should forward funds to wallet', async function() {
        let value = ether(1);

        const pre = web3.eth.getBalance(wallet);
        await this.crowdsale.addToWhitelist(investorB);

        await this.crowdsale.sendTransaction({ value, from: investorB }).should.be.fulfilled;
        const post = web3.eth.getBalance(wallet);

        post.minus(pre).should.be.bignumber.equal(value);
      });

      it('should tally post wallet balance', async function () {
        const totalTokensForSale = await this.crowdsale.totalTokensForSale.call();

        const postWalletBalance = web3.eth.getBalance(wallet);
        postWalletBalance.should.be.bignumber.equal(preWalletBalance.plus(ether(2)));
      });

      it('should be successful if sold tokens is equal to token sale reserved', async function () {
        const totalSupply = await this.token.totalSupply();

        const remainingTokensForSale = TOTAL_TOKENS_FOR_SALE.minus(totalSupply);
        const remainingTokenCostForEntireTokenReserved = remainingTokensForSale.dividedBy(rateDuringCrowdsaleStage);

        const remainingTokenCostForEntireTokenReservedInEther = web3.fromWei(remainingTokenCostForEntireTokenReserved, 'ether').toNumber();

        await this.crowdsale.addToWhitelist(investorC);
        await this.crowdsale.sendTransaction({ value: ether(remainingTokenCostForEntireTokenReservedInEther), from: investorC }).should.be.fulfilled;
      });

      it('should be rejected if sold tokens beyond token sale reserve',async function () {
        let value = ether(1);
        await this.crowdsale.addToWhitelist(investorD);
        await this.crowdsale.sendTransaction({ value, from: investorD }).should.be.rejected;
      });


    });
  });
});
