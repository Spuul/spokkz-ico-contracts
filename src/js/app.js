App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,

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
    /*
     * Replace me...
     */
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $('#accountAddress').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if (err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });

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
};

$(function() {
  $(window).on('load', function() {
    App.init();
  });
});