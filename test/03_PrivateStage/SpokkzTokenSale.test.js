import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');

const BigNumber = web3.BigNumber;

const scaleDownValue = 100;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const cap = ether(50000).dividedBy(scaleDownValue); // 500 ethers

const capTokenSupply = new BigNumber('1e27'); // 1 Billion


const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokkzTokenSale', function ([_, wallet, purchaser, investorA, investorB, investorC]) {
  describe('Private Stage', function () {

    describe('Within private token supply reserve', function () {
      const preWalletBalance = web3.eth.getBalance(wallet);

      before(async function () {
        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, wallet, this.token.address, cap);
        await this.token.transferOwnership(this.crowdsale.address);
      });

      it('should reject transaction if not whitelisted ', async function () {
        await this.crowdsale.sendTransaction({ value: ether(1), from: investorA }).should.be.rejected;
      });

      it('should be successful transaction if whitelisted', async function () {
        let value = ether(1);
        let expectedTokenAmount = rateDuringPrivateStage.times(value);

        await this.crowdsale.addToWhitelist(investorA);

        await this.crowdsale.sendTransaction({ value: value, from: investorA }).should.be.fulfilled;
        let balance = await this.token.balanceOf(investorA);
        balance.should.be.bignumber.equal(expectedTokenAmount);
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
        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, wallet, this.token.address, cap);
        await this.token.transferOwnership(this.crowdsale.address);

        await this.crowdsale.addToWhitelist(investorA);
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
  });
});
