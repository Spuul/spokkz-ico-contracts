const SpokTokenSale = artifacts.require('SpokTokenSale');
const SpokToken = artifacts.require('SpokToken');
const capValue = 26260;

contract('SpokTokenSale', function(accounts) {
  it('should deploy the token and store the address', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      const token = await instance.token.call();
      console.log("Spok Token Address: " + token);
      assert(token, 'Token address couldn\'t be stored');
      done();
    });
  });

  it('should set default token sale stage to PreICO', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      const stage = await instance.stage.call();
      assert.equal(stage.toNumber(), 0, 'The stage couldn\'t be set to PreICO');
      done();
    });
  });

  it('should set default cap of ethers during token salse', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      const cap = await instance.cap.call();
      assert.equal(web3.fromWei(cap.toNumber(), "ether"), capValue, 'The default cap is wrong');
      done();
    });
  });

  it('one ETH should buy 8870 Spok Tokens in PreICO', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      const data = await instance.sendTransaction({
        from: accounts[7],
        value: web3.toWei(1, "ether")
      });
      const tokenAddress = await instance.token.call();
      const spokToken = SpokToken.at(tokenAddress);

      const tokenAmount = await spokToken.balanceOf(accounts[7]);
      const totalSupply = await spokToken.totalSupply();

      assert.equal(tokenAmount.toNumber(), 8870000000000000000000, 'The sender didn\'t receive the tokens as per PreICO rate');
      assert.equal(totalSupply.toNumber(), 8870000000000000000000, 'The current totalSupply is wrong');
      done();
    });
  });

  it('should transfer the ETH to wallet immediately in Pre ICO', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      let balanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
      balanceOfBeneficiary = Number(balanceOfBeneficiary);

      await instance.sendTransaction({
        from: accounts[1],
        value: web3.toWei(2, "ether")
      });

      let newBalanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
      newBalanceOfBeneficiary = Number(newBalanceOfBeneficiary);

      assert.equal(newBalanceOfBeneficiary, balanceOfBeneficiary + 2000000000000000000, 'ETH couldn\'t be transferred to the beneficiary');
      done();
    });
  });

  it('should set variable `totalWeiRaisedDuringPreICO` correctly', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      var amount = await instance.totalWeiRaisedDuringPreICO.call();
      assert.equal(amount.toNumber(), web3.toWei(3, "ether"), 'Total ETH raised in PreICO was not calculated correctly');
      done();
    });
  });

  it('should get dashboard data correctly', function(done) {
    SpokTokenSale.deployed().then(async function(instance) {
      var [_stage, _weiRaised, _cap] = await instance.getDashboardData.call();
      var weiRaised = await instance.weiRaised.call();

      assert.equal(_stage.toNumber(), 0, 'The stage is not PreICO');
      assert.equal(_weiRaised.toNumber(), weiRaised, 'Total ETH raised in PreICO was not calculated correctly');
      assert.equal(web3.fromWei(_cap.toNumber(), "ether"), capValue, 'The default cap value is wrong');
      done();
    });
  });

});