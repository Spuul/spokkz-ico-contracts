import ether from '../../node_modules/zeppelin-solidity/test/helpers/ether';

const SpokkzTokenSale = artifacts.require('SpokkzTokenSale');
const SpokkzToken = artifacts.require('SpokkzToken');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CAP = ether(50000);

const PRIVATE_STAGE = new BigNumber(0);
const PreICO = new BigNumber(1);
const ICO = new BigNumber(2);


const MAX_SUPPLY_OF_TOKENS = ether(1000000000);
const TOTAL_TOKENS_FOR_SALE = ether(300000000);

const TOKENS_FOR_ECOSYSTEM = ether(430000000);
const TOKENS_FOR_TEAM = ether(140000000);
const TOKENS_FOR_ADVISORS = ether(60000000);
const TOKENS_FOR_LEGAL_AND_MARKETING = ether(60000000);
const TOKENS_FOR_BOUNTY = ether(10000000);

contract('SpokkzTokenSale', function(accounts) {
  describe('settings', function() {
    it('should set the correct cap', function(done) {
      SpokkzTokenSale.deployed().then(async function(instance) {
        const cap = await instance.cap.call();
        cap.should.be.bignumber.equal(CAP);
        done();
      });
    });

    it('should set default token sale stage to Private', function(done) {
      SpokkzTokenSale.deployed().then(async function(instance) {
        const stage = await instance.stage.call();
        stage.should.be.bignumber.equal(PRIVATE_STAGE);
        done();
      });
    });

    it('should set the token supply and distribution correctly', function(done) {
      SpokkzTokenSale.deployed().then(async function(instance) {
        const maxSupplyOfTokens = await instance.maxSupplyOfTokens.call();

        const totalTokensForSale = await instance.totalTokensForSale.call();
        const tokensForEcosystem = await instance.tokensForEcosystem.call();
        const tokensForTeam = await instance.tokensForTeam.call();
        const tokensForAdvisors = await instance.tokensForAdvisors.call();
        const tokensForLegalAndMarketing = await instance.tokensForLegalAndMarketing.call();
        const tokensForBounty = await instance.tokensForBounty.call();

        maxSupplyOfTokens.should.be.bignumber.equal(MAX_SUPPLY_OF_TOKENS);

        totalTokensForSale.should.be.bignumber.equal(TOTAL_TOKENS_FOR_SALE);
        tokensForEcosystem.should.be.bignumber.equal(TOKENS_FOR_ECOSYSTEM);
        tokensForTeam.should.be.bignumber.equal(TOKENS_FOR_TEAM);
        tokensForAdvisors.should.be.bignumber.equal(TOKENS_FOR_ADVISORS);
        tokensForLegalAndMarketing.should.be.bignumber.equal(TOKENS_FOR_LEGAL_AND_MARKETING);
        tokensForBounty.should.be.bignumber.equal(TOKENS_FOR_BOUNTY);

        totalTokensForSale.plus(tokensForEcosystem)
          .plus(tokensForTeam)
          .plus(tokensForAdvisors)
          .plus(tokensForLegalAndMarketing)
          .plus(tokensForBounty).should.be.bignumber.equal(MAX_SUPPLY_OF_TOKENS);

        done();
      });
    });
  });
});


  // it('should set the rate per stage correctly', function(done) {
  //   SpokkzTokenSale.deployed().then(async function(instance) {
  //
  //   });

  // it('should set the correct private stage rate', function(done)

  //
  // it('should set default cap of ethers during token sale', function(done) {
  //   SpokkzTokenSale.deployed().then(async function(instance) {
  //     const cap = await instance.cap.call();
  //     assert.equal(web3.fromWei(cap.toNumber(), "ether"), capValue, 'The default cap is wrong');
  //     done();
  //   });
  // });

  // it('one ETH should buy correct number of during Private stage', function(done) {
  //   SpokkzTokenSale.deployed().then(async function(instance) {
  //     const data = await instance.sendTransaction({
  //       from: accounts[7],
  //       value: web3.toWei(1, "ether")
  //     });
  //     const tokenAddress = await instance.token.call();
  //     const spokToken = Spokkz.at(tokenAddress);
  //
  //     const tokenAmount = await spokToken.balanceOf(accounts[7]);
  //     const totalSupply = await spokToken.totalSupply();
  //
  //     assert.equal(tokenAmount.toNumber(), , 'The sender didn\'t receive the tokens as per PreICO rate');
  //     assert.equal(totalSupply.toNumber(), , 'The current totalSupply is wrong');
  //     done();
  //   });
  // });
  //
  // it('should transfer the ETH to wallet immediately in Pre ICO', function(done) {
  //   SpokkzTokenSale.deployed().then(async function(instance) {
  //     let balanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
  //     balanceOfBeneficiary = Number(balanceOfBeneficiary);
  //
  //     await instance.sendTransaction({
  //       from: accounts[1],
  //       value: web3.toWei(2, "ether")
  //     });
  //
  //     let newBalanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
  //     newBalanceOfBeneficiary = Number(newBalanceOfBeneficiary);
  //
  //     assert.equal(newBalanceOfBeneficiary, balanceOfBeneficiary + 2000000000000000000, 'ETH couldn\'t be transferred to the beneficiary');
  //     done();
  //   });
  // });
  //
  // it('should set variable `totalWeiRaisedDuringPreICO` correctly', function(done) {
  //   SpokkzTokenSale.deployed().then(async function(instance) {
  //     var amount = await instance.totalWeiRaisedDuringPreICOStage.call();
  //     assert.equal(amount.toNumber(), web3.toWei(3, "ether"), 'Total ETH raised in PreICO was not calculated correctly');
  //     done();
  //   });
  // });
  //
  // it('should get dashboard data correctly', function(done) {
  //   SpokkzTokenSale.deployed().then(async function(instance) {
  //     var [_stage, _weiRaised, _cap] = await instance.getDashboardData.call();
  //     var weiRaised = await instance.weiRaised.call();
  //
  //     assert.equal(_stage.toNumber(), 1, 'The stage is not PreICO');
  //     assert.equal(_weiRaised.toNumber(), weiRaised, 'Total ETH raised in PreICO was not calculated correctly');
  //     assert.equal(web3.fromWei(_cap.toNumber(), "ether"), capValue, 'The default cap value is wrong');
  //     done();
  //   });
  // });
