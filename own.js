const Currency = 'IXO';

module.exports = {

    createBalTable:  function(superAdmin){
        app.sdb.create('bal' ,{address:superAdmin, balance:'0' ,currency:'IXO'});
    },

    balanceOf: async function(tokenOwner){
        var Currency='IXO';
        function require(condition, error) {
            if (!condition) throw Error(error)
          }
        let option = {
            condition: {
              address: tokenOwner,
              currency: Currency
             },
             fields: ['balance']
           }
            var b= await app.model.Bal.findOne(option);
            require(b.balance !== undefined, 'address not found')
            return b.balance;
    },
    
    transferFrom: async function(fromaddr, toaddr, amount){
        function require(condition, error) {
            if (condition) throw Error(error)
          }

        var Currency = 'IXO';

        let option = {
        condition: {
          address: fromaddr,
          currency: Currency
         },
         fields: ['balance']
       }
        var frombal= await app.model.Bal.findOne(option);
        require((frombal) == undefined, 'Sender address not found')
        let option1 = {
            condition: {
              address: toaddr,
              currency: Currency
             },
             fields: ['balance']
           }
        var tobal =  await app.model.Bal.findOne(option1);
        require(tobal == undefined, 'Receiver address not found')
        require((frombal) < amount, 'Insufficient balance in senders address')

        app.sdb.update("bal",{balance:Number(frombal.balance) - amount},{address: fromaddr});
        app.sdb.update("bal",{balance:Number(tobal.balance) - -amount},{address: toaddr});
        //app.balances.transfer(Currency, amount, fromaddr, toaddr);
    },
    
    // transfer: async function(address, amount){
    //     return this.transferFrom(this.trs.senderID, address, amount);  // Called the transferFrom function for code reusability 
    // },                                                                 // assuming that transaction fees won't incur when a contract is 
                                                                        // called from another function.
                                                                        // I think that transaction fees incur only when a contract is called
                                                                        // with /transactions/unsigned type: 1000 
                                                                        // Will change it if that's not how it works.
    approve: async function(spender, amount){
        function require(condition, error) {
            if (!condition) throw Error(error)
          }
        var row = await app.model.Bal.findOne({Address: spender});
        require(row !== undefined, 'Spender address not found')
        
        let option2 = {
            condition: {
              owner:owner,
              spender:spender
             },
             fields: ['amount']
           }
        var  row = app.model.Approve.findOne(option2);
        require(row !== undefined, 'does not exist')
        if(!row){
            app.sdb.create("approve", {
                owner: this.trs.senderID,
                spender: spender,
                amount: amount
            });
        }else{
            app.sdb.update("approve",{amount: amount},{owner: this.trs.senderID, spender: spender});
        }
   },
    
    allowance: async function(owner, spender){
        let opt = {
        condition:{
            owner: owner,
            spender: spender
        },
        fields: ['amount']
    }
        var row = app.model.Approve.findOne(opt);
        return row;
    },

    spendAllowance: async function(owner1, amount1){
        function require(condition, error) {
            if (condition) throw Error(error)
          }
         
            let opt = {
            condition:{
                owner: owner1,
                spender: this.trs.senderID 
            },
            fields: ['amount']
        }
         var balance = app.model.Approve.findOne(opt);
        require(balance === 0, 'Zero allowance')
        require(amount1 > balance, 'Amount is greater than allowance')
        
        app.sdb.update("Approve",{amount: Number(balance.amount) - amount1},{owner: owner1,spender: this.trs.senderID});

        let option1 = {
            condition: {
              address: owner1,
              currency: Currency
             },
             fields: ['balance']
           }
        var frombal =  await app.model.Bal.findOne(option1);
 
        app.sdb.update("bal",{balance: Number(frombal.balance) - amount1},{address: owner1});

        let option2 = {
            condition: {
              address: this.trs.senderID,
              currency: Currency
             },
             fields: ['balance']
           }
        var tobal =  await app.model.Bal.findOne(option2);
        app.sdb.update("bal",{balance: Number(tobal.balance) + amount1},{address: this.trs.senderID});

        // var res=app.balances.transfer(Currency, amount, owner1,this.trs.senderID );
        // return res;
        
    },

    getTotalSupply: async function(){
        return app.model.Token.findOne({currency: CURRENCY}).totalSupply;
    },
    

    generateOneTimeDappAddress: function(superAdmin){
       // var AschJS = require('asch-js');
        //this function is designed in such a way where it can be executed absolutely once.

        var executed = false;              // ---> The closure variable
        return async function() {          // ---> The function that will actually be stored in generateOneTimeDappAddress
            if (!executed) {
                executed = true;

                var secret = Math.random().toString(36).substring(7);
                //var keys = AschJS.crypto.getKeys(secret);
                app.sdb.create("token",{
                    totalSupply: app.balances.get(this.trs.senderID),
                    currency: "IXO",
                    tokenExchangeRate: "0.1",
                    dappAddress: "0xajsfjasfa2346",
                    //dappAddress: AschJS.crypto.getAddress(keys.publicKey),
                    //dappPubKey: keys.publicKey(),
                    dappPubKey: "123",
                    shortName: "ixo",
                    precision: 8,
                    dappOwner:this.trs.senderID
                });
                
               // return secret;
            }else{
                return "Address already issued";
            }
   
        };
    }(),  //---> Called this function and it returns the return function which will be stored in generateOneTimeDappAddress
    // If using closures to achieve a singleton function doesn't work in blockchain sense, 
    // then the alternate idea is to write this function in init.js
    // assuming that init.js runs only one time when the Dapp is launched.

    // dAppAddress: async function(){
    //     return await app.model.Token.findOne({}).dappAddress;
    // },

    withdrawFromDAppAddress: async function(Currency,amount){
        //can include this so only owner of the DApp can withdraw funds in the DApp wallet.
        var Currency='IXO';
        function require(condition, error) {
            if (!condition) throw Error(error)
          }

        let row = await app.model.Token.findOne({fields:['dappOwner']});
        require(row !== this.trs.senderID, 'Only the owner can withdraw from DApp')                

         let option5= {
            condition: {
              address: row,
              currency: Currency
             },
             fields: ['balance']
           }
            var x= await app.model.Bal.findOne(option5);
            require(x<amount,'Insufficient balance in DApp wallet')
            app.sdb.update("bal", {balance: x-amount},{address:row});
       
    },

    mint: async function(toaddr, amount){
        var Currency='IXO';
        function require(condition, error) {
            if (!condition) throw Error(error)
          }

        var row = await app.model.Token.findOne({fields:['dappOwner']});
        console.log("Got object: " + JSON.stringify(row));
        require(row !== this.trs.senderID, 'Only the DApp owner can mint tokens')

       let option = {
        condition: {
          address: toaddr,
          currency: Currency
         },
         fields: ['balance']
       }
        var x= await app.model.Bal.findOne(option);
        require(x!== undefined, 'To address does not exist')
        app.sdb.update("bal",{balance: Number(x.balance) - -amount}, {address:toaddr});

        let option1 = {
            condition: {
              dappOwner: toaddr,
              currency: Currency
             },
             fields: ['totalSupply']
           }
        var tot= await app.model.Token.findOne(option1); 
     
       app.sdb.update("token",{totalSupply:tot + amount}, {dappOwner:toaddr});
       
    },

    burn: async function(amount){
        var Currency='IXO';
        function require(condition, error) {
            if (condition) throw Error(error)
          }
          let option = {
            condition: {
              address: this.trs.senderID,
              currency: Currency
             },
             fields: ['balance']
           }
        var x= await app.model.Bal.findOne(option); 
        require(Number(x.balance) < amount, 'Insufficient balance to burn')

        app.sdb.update("bal", {balance:Number(x.balance)-amount}, {address:this.trs.senderID});
        
        let option1 = {
            condition: {
              dappOwner: this.trs.senderID,
              currency: Currency
             },
             fields: ['totalSupply']
           }
        var total= await app.model.Token.findOne(option1); 
     
       app.sdb.update("token", {totalSupply:total - amount}, {dappOwner:this.trs.senderID});

    },

    burnFrom: async function(fromaddr, amount){
            var Currency='IXO';
            function require(condition, error) {
                if (condition) throw Error(error)
              }
              let option = {
                condition: {
                  address: fromaddr,
                  currency: Currency
                 },
                 fields: ['balance']
               }
            var x= await app.model.Bal.findOne(option); 
            require(x < amount, 'Insufficient balance to burn')
        //     let option1 = {
        //         condition: {
        //           dappOwner: fromaddr,
        //           currency: Currency
        //          },
        //          fields: ['totalSupply']
        //        }
        //     var totSup= await app.model.Token.findOne(option1); 
         
        // app.sdb.update("token", {totalSupply: totSup.totalSupply-amount}, {dappOwner:fromaddr});
        app.sdb.update("bal", {balance:x.balance-amount}, {address:fromaddr});

    }

}