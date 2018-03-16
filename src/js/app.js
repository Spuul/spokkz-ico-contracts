App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  contractCreatorAddress: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
  contractAddress: null,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if (typeof web3 !== 'undefined') {
      //reuse the provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      //create a new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    // App.displayAccountInfo();

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('SpokTokenSale.json', function(spokTokenSaleArtifact) {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.SpokTokenSale = TruffleContract(spokTokenSaleArtifact);
      // set the provider for our contracts
      App.contracts.SpokTokenSale.setProvider(App.web3Provider);

      return App.reloadDashboardData();
    }).then(function() {
      $.getJSON('SpokToken.json', function(spokTokenArtifact) {
        App.contracts.SpokToken = TruffleContract(spokTokenArtifact);
        App.contracts.SpokToken.setProvider(App.web3Provider);

        return App.displayAccountInfo();
      });
    });
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
        if (err === null) {

          App.account = account;

          if (!web3.isAddress(App.account)) {
            return;
          }

          $('#accountAddress').text(App.account);

          var contractCreator;

          if (App.account === App.contractCreatorAddress) {
            contractCreator = "Yes";
          } else {
            contractCreator = "No";
          }

          $('#contractCreator').text(contractCreator);

          web3.eth.getBalance(account, function(err, balance) {
            if (err === null) {
              $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
            }
          })
        }
      }

    );

    web3.version.getNetwork((err, netId) => {
      var networkType;

      switch (netId) {
        case "1":
          networkType = "Main Net";
          break
        case "2":
          networkType = "Morden Test (Deprecated)";
          break
        case "3":
          networkType = "Ropsten Test";
          break
        case "4":
          networkType = "Rinkeby Test";
          break
        case "42":
          networkType = "Kovan Test";
          break
        default:
          console.log('This is an unknown network. ' + netId)
          networkType = "Development (Ganache)";
      }

      $('#networkId').text(networkType);

    });

    App.contracts.SpokTokenSale.deployed().then(function(instance) {
      return spokTokenSaleInstance.whitelist(App.account);
    }).then(function(whitelisted) {
      $("#whitelisted").text(whitelisted ? 'Yes' : 'No')
    });

    App.contracts.SpokToken.deployed().then(function(instance) {

      if (!web3.isAddress(App.account)) {
        return;
      }
      var accountWithNoIdentifier = (App.account).substring(2);
      var contractData = ('0x70a08231000000000000000000000000' + accountWithNoIdentifier);
      web3.eth.call({
        to: instance.address,
        data: contractData
      }, function(err, result) {
        if (result) {
          var spokTokenBalanceWei = new BigNumber(result).toString();
          var spokTokenBalance = web3.fromWei(spokTokenBalanceWei, 'ether');
          $('#tokenBalance').text(spokTokenBalance);
        } else {
          console.log(err); // Dump errors here
        }
      });
    });

  },

  reloadDashboardData: function() {
    // avoid reentry
    if (App.loading) {
      return;
    }
    App.loading = true;

    var tokenSaleInstance;

    console.log("App.contracts");
    console.log(App.contracts);

    App.contracts.SpokTokenSale.deployed().then(function(instance) {
      spokTokenSaleInstance = instance;
      $('#contractAddress').text(instance.address);
      return spokTokenSaleInstance.getTokenSaleData();
    }).then(function(dashboardData) {
      var stage = dashboardData[0];
      var etherRaised = web3.fromWei(dashboardData[1].toNumber(), 'ether');
      var etherCap = web3.fromWei(dashboardData[2].toNumber(), 'ether');
      var goal = web3.fromWei(dashboardData[3].toNumber(), 'ether');
      var openingTime = dashboardData[4];
      var closingTime = dashboardData[5];
      var now = dashboardData[6];
      switch (stage.toString()) {
        case "0":
          stageName = "Private"
          break;
        case "1":
          stageName = "Pre-ICO"
          break;
        case "1":
          stageName = "ICO"
          break;
        default:
          stageName = "Error"
          console.log(stage);
          break;
      }
      $('#currentStage').text(stageName);

      $('#currentRaised').text(etherRaised + " ETH");
      $('#cap').text(etherCap + " ETH");
      $('#goal').text(goal + " ETH")
      $('#openingTime').text(moment.unix(openingTime).utc());
      $('#closingTime').text(moment.unix(closingTime).utc());
      $('#now').text(moment().utc());

      App.loading = false;
    }).then(function() {
      console.log("Stage Data");
      var privatePromise = spokTokenSaleInstance.getTokenSaleDataByStage(0);
      var preICOPromise = spokTokenSaleInstance.getTokenSaleDataByStage(1);
      var ICOPromise = spokTokenSaleInstance.getTokenSaleDataByStage(2);

      Promise.all([privatePromise, preICOPromise, ICOPromise]).then(function(values) {

        var privateRate = values[0][0];
        var preICORate = values[1][0];
        var ICORate = values[2][0];

        var privateTokenForSale = web3.fromWei(values[0][1].toNumber(), 'ether');
        var preICORateTokenForSale = web3.fromWei(values[1][1].toNumber(), 'ether');
        var ICORateTokenForSale = web3.fromWei(values[2][1].toNumber(), 'ether');

        var privateEtherRaised = web3.fromWei(values[0][2].toNumber(), 'ether');
        var preICOEtherRaised = web3.fromWei(values[1][2].toNumber(), 'ether');
        var ICOEtherRaised = web3.fromWei(values[2][2].toNumber(), 'ether');

        var privateTokenSold = privateEtherRaised * privateRate;
        var preICOETokenSold = preICOEtherRaised * preICORate;
        var ICOTokenSold = ICOEtherRaised * ICORate;

        $('#privateRate').text(privateRate + " SPK");
        $('#preICORate').text(preICORate + " SPK");
        $('#ICORate').text(ICORate + " SPK");

        $('#privateTokenForSale').text(privateTokenForSale + " SPK");
        $('#preICORateTokenForSale').text(preICORateTokenForSale + " SPK");
        $('#ICORateTokenForSale').text(ICORateTokenForSale + " SPK");

        $('#privateEtherRaised').text(privateEtherRaised + " SPK");
        $('#preICOEtherRaised').text(preICOEtherRaised + " SPK");
        $('#ICOEtherRaised').text(ICOEtherRaised + " SPK");

        $('#privateTokenSold').text(privateTokenSold + " SPK");
        $('#preICOETokenSold').text(preICOETokenSold + " SPK");
        $('#ICOTokenSold').text(ICOTokenSold + " SPK");
      });

    }).catch(function(err) {
      console.error(err.message);
      App.loading = false;
    });
  },

  buyToken: function() {

    var _amount = web3.toWei(parseFloat($('#amount').val() || 0), "ether");

    if (_amount == 0) {
      // nothing to sell
      return false;
    }

    console.log('hello');

    App.contracts.SpokTokenSale.deployed().then(function(instance) {
      web3.eth.sendTransaction({
        from: App.account,
        to: instance.address,
        value: _amount
      }, function(err, transactionHash) {
        if (!err) {
          console.log("sendTransaction: success");
          console.log(transactionHash);
        } else {
          console.log("sendTransaction: fail");
          console.log(err);
        }
      });
    });
  }
}

$(function() {
  $(window).on('load', function() {
    App.init();
  });
});