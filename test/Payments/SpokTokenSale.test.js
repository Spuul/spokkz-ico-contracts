import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokTokenSale = artifacts.require('SpokTokenSale');
const SpokToken = artifacts.require('SpokToken');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SpokTokenSale', function ([_, investor, wallet, purchaser]) {
  const scaleDownValue = 100;

  const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
  const rateDuringPreICOStage = new BigNumber(7058).times(scaleDownValue);
  const rateDuringICOStage = new BigNumber(6000).times(scaleDownValue);
  const cap = new BigNumber(50000000000000000000000).dividedBy(scaleDownValue); // 500 ethers

  beforeEach(async function () {
    this.token = await SpokToken.new();
    this.crowdsale = await SpokTokenSale.new(rateDuringPrivateStage,rateDuringPreICOStage,rateDuringICOStage, wallet, this.token.address, cap);
    await this.token.transferOwnership(this.crowdsale.address);
  });

  describe('accepting payments', function () {
    it('should accept payments', async function () {
      let value = ether(1);
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });
  });

  describe('high-level purchase', function () {
    let value = ether(1);
    let expectedTokenAmount = rateDuringPrivateStage.times(value);

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  describe('low-level purchase', function () {
    let value = ether(1);
    let expectedTokenAmount = rateDuringPrivateStage.times(value);

    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });
});
