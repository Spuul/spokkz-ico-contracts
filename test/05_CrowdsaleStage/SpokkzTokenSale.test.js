import { advanceBlock } from '../../node_modules/zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/zeppelin-solidity/test/helpers/increaseTime';
import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';
import latestTime from '../../node_modules/zeppelin-solidity/test/helpers/latestTime';

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
  describe('Public sale stage', function () {
    describe('Start crowdsale stage after presale', function () {

      const preWalletBalance = web3.eth.getBalance(wallet);

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
      });

      it('should be able to start next sale if owner', async function() {
        const preStage = await this.crowdsale.stage.call();
        preStage.should.be.bignumber.equal(PRIVATE_STAGE);

        await this.crowdsale.startNextSaleStage().should.be.fulfilled;
        await this.crowdsale.startNextSaleStage().should.be.fulfilled;
        const postStage = await this.crowdsale.stage.call();
        postStage.should.be.bignumber.equal(CROWDSALE_STAGE);
      });

      it('should be successfull payment transaction but balance is in token timelock contract', async function() {
        let value = ether(1);
        await this.crowdsale.addToWhitelist(investorA);
        const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investorA }).should.be.fulfilled;

        const event = logs.find(e => e.event === 'TokenTimelockCreated');
        should.exist(event);

        let funderBalance = await this.token.balanceOf(investorA);
        funderBalance.should.be.bignumber.equal(0);

        let expectedTokenAmount = rateDuringCrowdsaleStage.times(value);
        let tokenContractBalance = await this.token.balanceOf(event.args.tokenTimelock);

        tokenContractBalance.should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should forward funds to wallet', async function() {
        let value = ether(1);

        await this.crowdsale.addToWhitelist(investorB);
        await this.crowdsale.sendTransaction({ value, from: investorB }).should.be.fulfilled;

        const vaultBalance = web3.eth.getBalance(this.vaultAddress);
        vaultBalance.should.be.bignumber.equal(ether(2));

        const investorADeposit = await this.vault.deposited(investorA);
        investorADeposit.should.be.bignumber.equal(ether(1));

        const investorBDeposit = await this.vault.deposited(investorB);
        investorBDeposit.should.be.bignumber.equal(ether(1));

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
