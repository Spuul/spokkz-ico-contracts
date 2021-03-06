import { advanceBlock } from '../../node_modules/zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../../node_modules/zeppelin-solidity/test/helpers/increaseTime';
import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';
import latestTime from '../../node_modules/zeppelin-solidity/test/helpers/latestTime';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');
const RefundVault = artifacts.require('RefundVault');

const BigNumber = web3.BigNumber;

const scaleDownValue = 100;

const rateDuringPrivateStage = new BigNumber(12000).times(scaleDownValue);
const rateDuringPresaleStage = new BigNumber(7058).times(scaleDownValue);
const rateDuringCrowdsaleStage = new BigNumber(6000).times(scaleDownValue);
const goal = ether(11111).dividedBy(scaleDownValue); // 11.111 ethers
const cap = ether(50000).dividedBy(scaleDownValue); // 500 ethers

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

contract('SpokkzTokenSale', function ([_, wallet, investorA, investorB, investorC, investorD, investorE, investorF, ecosystemFund, otherFunds ]) {
  describe('Presale stage', function () {
    describe('Start presale stage after private', function () {


      before(async function () {
        await advanceBlock();

        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, goal, cap, this.openingTime, this.closingTime, ecosystemFund, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.start();
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

    describe('Within presale token supply reserve', function () {
      const preWalletBalance = web3.eth.getBalance(wallet);

      before(async function () {
        await advanceBlock();

        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, goal, cap, this.openingTime, this.closingTime, ecosystemFund, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        const vaultAddress = await this.crowdsale.vault.call();
        this.vault = RefundVault.at(vaultAddress);

        await increaseTimeTo(this.openingTime);

        await this.crowdsale.addToWhitelist(investorA);
        await this.crowdsale.start();
      });

      it('should be able to buy tokens in private stage', async function () {
        const totalTokensForSaleDuringPrivateStage = await this.crowdsale.totalTokensForSaleDuringPrivateStage.call();
        this.remainingTokenCostForPrivateStage = totalTokensForSaleDuringPrivateStage.dividedBy(rateDuringPrivateStage);

        await this.crowdsale.sendTransaction({ value: this.remainingTokenCostForPrivateStage, from: investorA }).should.be.fulfilled;
      });

      it('should be able to start presale stage', async function() {
        this.crowdsale.startNextSaleStage().should.be.fulfilled;
        const postStage = await this.crowdsale.stage.call();
        postStage.should.be.bignumber.equal(PRESALE_STAGE);
      });

      it('should be successfull payment transaction but balance is in vesting contract', async function() {
        let value = ether(1);
        await this.crowdsale.addToWhitelist(investorB);
        const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investorB }).should.be.fulfilled;

        const event = logs.find(e => e.event === 'TokenVestingCreated');
        should.exist(event);

        let funderBalance = await this.token.balanceOf(investorB);
        funderBalance.should.be.bignumber.equal(0);

        let expectedTokenAmount = rateDuringPresaleStage.times(value);
        let tokenContractBalance = await this.token.balanceOf(event.args.tokenVesting);

        tokenContractBalance.should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should forward funds to vault', async function () {
        let value = ether(1);
        await this.crowdsale.sendTransaction({ value, from: investorA });

        const vaultAddress = await this.crowdsale.vault.call();
        const vaultBalance = web3.eth.getBalance(vaultAddress);

        vaultBalance.should.be.bignumber.equal(ether(2).add(this.remainingTokenCostForPrivateStage));

        const investorADeposit = await this.vault.deposited(investorA);
        investorADeposit.should.be.bignumber.equal(ether(1).add(this.remainingTokenCostForPrivateStage));

        const investorBDeposit = await this.vault.deposited(investorB);
        investorBDeposit.should.be.bignumber.equal(ether(1));
      });
    });

    describe('Over presale token supply reserve', function () {
      before(async function () {
        await advanceBlock();

        this.openingTime = latestTime() + duration.days(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);

        this.token = await SpokkzToken.new(capTokenSupply);
        this.crowdsale = await SpokkzTokenSale.new(rateDuringPrivateStage,rateDuringPresaleStage,rateDuringCrowdsaleStage, raisedPrivatelyPreDeployment, wallet, this.token.address, goal, cap, this.openingTime, this.closingTime, ecosystemFund, otherFunds);
        await this.token.transferOwnership(this.crowdsale.address);

        await increaseTimeTo(this.openingTime);

        await this.crowdsale.start();

        await this.crowdsale.addToWhitelist(investorA);

        const totalTokensForSaleDuringPrivateStage = await this.crowdsale.totalTokensForSaleDuringPrivateStage.call();
        const remainingTokenCostForPrivateStage = totalTokensForSaleDuringPrivateStage.dividedBy(rateDuringPrivateStage);
        await this.crowdsale.sendTransaction({ value: remainingTokenCostForPrivateStage, from: investorA }).should.be.fulfilled;
        this.crowdsale.startNextSaleStage().should.be.fulfilled;
      });

      it('should be able to buy more than the presale token reserve', async function () {
        let value = ether(75);

        await this.crowdsale.addToWhitelist(investorB);
        await this.crowdsale.addToWhitelist(investorC);
        await this.crowdsale.addToWhitelist(investorD);
        await this.crowdsale.addToWhitelist(investorE);

        await this.crowdsale.sendTransaction({ value: value, from: investorB }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: value, from: investorC }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: value, from: investorD }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: value, from: investorE }).should.be.fulfilled;
      });

      it('should be able to buy up to the entire token sale reserved', async function () {
        const totalSupply = await this.token.totalSupply();
        const remainingTokensForSale = TOTAL_TOKENS_FOR_SALE.minus(totalSupply);
        const remainingTokenCostForEntireTokenReserved = remainingTokensForSale.dividedBy(rateDuringPresaleStage);

        const remainingTokenCostForEntireTokenReservedInEther = web3.fromWei(remainingTokenCostForEntireTokenReserved, 'ether').toNumber();

        await this.crowdsale.addToWhitelist(investorF);
        await this.crowdsale.sendTransaction({ value: ether(remainingTokenCostForEntireTokenReservedInEther), from: investorF }).should.be.fulfilled;
      });

      it('should not be able to buy more than the entire token sale reserved', async function() {
        let value = ether(1);
        await this.crowdsale.sendTransaction({ value: value, from: investorF }).should.be.rejected;
      })

    });
  });
});
