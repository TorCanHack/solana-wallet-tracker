const express = require('express')
const cors = require('cors')
const axios = require('axios')
const app = express();
const PORT = process.env.PORT || 10000;
const { devnet,  createSolanaRpc, address,  signature, createSolanaRpcSubscriptions, getAddressFromPublicKey, lamports, generateKeyPair, } = require('@solana/web3.js');
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}));
const rpcDevnet = createSolanaRpc(devnet('https://devnet.helius-rpc.com/?api-key=8bb98b5c-4864-4f7d-bcfe-1dada6f44cca'))
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://devnet.helius-rpc.com/?api-key=8bb98b5c-4864-4f7d-bcfe-1dada6f44cca')
const { solanaTokenTracker } = require('./utility/solanaTokenTracker');  

const tokenTracker = new solanaTokenTracker();




app.get("/api/transactions/:address", async (req, res) => {
    try {
        const address = req.params.address // Convert to PublicKey

        const response = await axios.get(`https://api.helius.xyz/v0/addresses/${address}/transactions/?api-key=8bb98b5c-4864-4f7d-bcfe-1dada6f44cca`)
        console.log("wallet transactions: ", response.data);
        
        /*// Get signatures
        const signatures = await rpc.getSignaturesForAddress(address, {
            limit: 20
        }).send(); // Add .send() call
        
        console.log('Signatures:', signatures);
        
        if (!Array.isArray(signatures)) {
            throw new Error('No signatures found or invalid response format');
        }*/

        /*const txDetails = await Promise.all(
            signatures.map(async (tx) => {
                const details = await rpc.getTransaction(tx.signature).send(); // Add .send() here too
                return {
                    signature: tx.signature,
                    timestamp: tx.blockTime,
                    status: tx.confirmationStatus,
                    details
                };
            })
        );
        res.json(txDetails);*/
        
        res.json(response.data)
    } catch(error) {
        console.error('Error details:', error);
        res.status(500).json({error: error.message});
    }
});

app.get("/api/getassets/:address", async (req, res) => {
    const address = req.params.address;
    try {
        
        
        const API_KEY = '8bb98b5c-4864-4f7d-bcfe-1dada6f44cca';
        const BASE_URL = `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`;
        

        const response = await axios({
            method: 'POST',
            url: BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: address,
                    displayOptions: {
                        showFungible: true,
                        showNativeBalance: true,
                    }
                }
            },
            timeout: 15000
        });
        
        
        
        res.json(response.data.result);
    } catch (error) {
        console.error('Error in /api/getassets:', error);
        // Send error response to client
        res.status(500).json({ 
            error: error.message,
            details: error?.response?.data || 'No additional error details'
        });
    }
});

// Then use it in your routes
/*app.get('/api/wallet/:address/balance', async (req, res) => {

    try {
      const balance = await devnetManager.checkBalance(req.params.address);
      res.json({ balance });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});*/

app.get("/api/getpnl", async (req, res) => {

    const TOKEN_INSTRUCTION_LAYOUTS = {

        Transfer: {
            index: 3,
            layout: {
                amount: 'u64'
            }
        },
        TransferChecked: {
            index: 12,
            layout: {
                amount: 'u64',
                decimals: 'u8'
            }
        }
    }

    const SolanaTokenTracker = () => {
        async 
    }
})


//BkE9J4SEuxdEci8xdLiZ3gSsSg16Wq16d5sU48Do3fQ5 devnte
//3kZjv4QP2ZA6Zk167zaBRDiSdEyuq6GnnvQRvTr3rvuT donald's

app.get("/api/testing", async (req, res) => {
    try {

        const walletAddress = '3kZjv4QP2ZA6Zk167zaBRDiSdEyuq6GnnvQRvTr3rvuT';
        const tokenAddress = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr';
        // Get token transaction history
        const transactions = await tokenTracker.getTokenTransactions(walletAddress, tokenAddress);

     // Return the results
     res.json({
         success: true,
         data: {
             transactions,
             totalTransactions: transactions.length,
             // Add summary information
             summary: {
                 buys: transactions.filter(tx => tx.transactionType === 'buy').length,
                 sells: transactions.filter(tx => tx.transactionType === 'sell').length
             }
         }
     });

 } catch (error) {
     console.error('Error in /token-history:', error);
     res.status(500).json({
         success: false,
         error: 'Failed to fetch token history'
     });
 }
})

app.get("/api/getacc", async (req, res) => {

    try {
        
        const searchAddress = address('9EJCUh6igZLAyFNspeWZsBBxhZxgBx4oGYKpHprt87y');
        const solanaRpc = createSolanaRpc("https://still-falling-tent.solana-mainnet.quiknode.pro/0c3c673153b7081ce8dfab51d6d98b175e724374/");
        const accountInfo = await solanaRpc.getAccountInfo(searchAddress).send();
        console.log(accountInfo);

        const processedAccount = JSON.parse(JSON.stringify(accountInfo, (key, value) => 
            typeof value === 'bigint' ? value.toString(): value))
             
        res.json(processedAccount)

    } catch (error) {
        console.error("Error fetching transaction:", error);
    }



})
app.get("/api/test/:signature", async (req, res) => {

    const solanaRpc = createSolanaRpc("https://still-falling-tent.solana-mainnet.quiknode.pro/0c3c673153b7081ce8dfab51d6d98b175e724374/");

    const txSignature = req.params.signature

    //signature("5q1rEkjqeADti8UPNtGpR1o2Rs1Rj7R2ivrXSDKNhGYtqxL4zcJSmK44zbwsM7o3fKMjsa5JA6xfzdGtiMXZFvKP");

    try {
        
        const transaction = await solanaRpc.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        encoding: 'jsonParsed'
        }).send();

        const processedTransaction = JSON.parse(JSON.stringify(transaction, (key, value) => 
            typeof value === 'bigint' ? value.toString(): value))
        console.log(processedTransaction);
        res.json(processedTransaction)
    } catch (error) {
    console.error("Error fetching transaction:", error);
    }


   

})

app.get("/api/gettx", async (req, res) => {

    try {
        
        
        const API_KEY = '8bb98b5c-4864-4f7d-bcfe-1dada6f44cca';
        const BASE_URL = `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`;
        

        const response = await axios({
            method: 'POST',
            url: BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                jsonrpc: '2.0',
                id: '1',
                method: 'getAccountInfo',
                params: [

                    "9EJCUh6igZLAyFNspeWZsBBxhZxgBx4oGYKpHprt87y",
                    {
                    "encoding": "base58"
                    }
                ]
            },
            timeout: 15000
        });
        
        console.log(response.data)
        
        res.json(response.data.result);
    } catch (error) {
        console.error('Error in /api/getassets:', error);
        // Send error response to client
        res.status(500).json({ 
            error: error.message,
            details: error?.response?.data || 'No additional error details'
        });
    }

})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});