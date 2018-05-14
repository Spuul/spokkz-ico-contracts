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
const PRESALE_STAGE = new BigNumber(1);
const CROWDSALE_STAGE = new BigNumber(2);

const MAX_SUPPLY_OF_TOKENS = new BigNumber('1e27');
const TOTAL_TOKENS_FOR_SALE = new BigNumber('3e26');

const TOKENS_FOR_ECOSYSTEM = new BigNumber('43e25');
const TOKENS_FOR_TEAM = new BigNumber('14e25');
const TOKENS_FOR_ADVISORS = new BigNumber('6e25');
const TOKENS_FOR_LEGAL_AND_MARKETING = new BigNumber('6e25');
const TOKENS_FOR_BOUNTY = new BigNumber('1e25');

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

    it('should set the token supply in token contract', function(done) {
      SpokkzToken.deployed().then(async function(instance) {
        const cap = await instance.cap.call();
        cap.should.be.bignumber.equal(MAX_SUPPLY_OF_TOKENS);
        done();
      })
    });

    it('should set start property to false by default', function(done) {
      SpokkzTokenSale.deployed().then(async function(instance) {
        const hasStarted = await instance.hasStarted.call();
        assert.isFalse(hasStarted);
        done();
      })
    });
  });
});
