App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  loading: false,
  contractCreatorAddress: "0x627306090abab3a6e1400e9345bc60c78a8bef57",

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

    App.displayAccountInfo();

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('SpokTokenSale.json', function(spokTokenSaleArtifact) {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.SpokTokenSale = TruffleContract(spokTokenSaleArtifact);
      // set the provider for our contracts
      App.contracts.SpokTokenSale.setProvider(App.web3Provider);

      return App.reloadDashboardData();
    });
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
        if (err === null) {
          App.account = account;

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
  },

  reloadDashboardData: function() {
    // avoid reentry
    if (App.loading) {
      return;
    }
    App.loading = true;

    App.displayAccountInfo();

    var tokenSaleInstance;

    console.log("App.contracts");
    console.log(App.contracts);

    App.contracts.SpokTokenSale.deployed().then(function(instance) {
      spokTokenSaleInstance = instance;
      return spokTokenSaleInstance.getDashboardData();
    }).then(function(dashboardData) {
      var stage = dashboardData[0];
      var etherRaised = web3.fromWei(dashboardData[1].toNumber(), 'ether');
      var etherCap = web3.fromWei(dashboardData[2].toNumber(), 'ether');

      var cap = dashboardData[2];

      switch (stage.toString()) {
        case "0":
          stageName = "Pre ICO"
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
      $('#currentRaised').text(etherRaised);
      $('#cap').text(etherCap + " ETH");

      App.loading = false;
    }).catch(function(err) {
      console.error(err.message);
      App.loading = false;
    });

    //   return chainListInstance.getArticlesForSale();
    // }).then(function(articleIds) {
    //   // retrieve the article placeholder and clear it
    //   $('#articlesRow').empty();
    //
    //   for(var i = 0; i < articleIds.length; i++) {
    //     var articleId = articleIds[i];
    //     chainListInstance.articles(articleId.toNumber()).then(function(article){
    //       App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
    //     });
    //   }
    //   App.loading = false;
    // }).catch(function(err) {
    //   console.error(err.message);
    //   App.loading = false;
  },
};

$(function() {
  $(window).on('load', function() {
    App.init();
  });
});