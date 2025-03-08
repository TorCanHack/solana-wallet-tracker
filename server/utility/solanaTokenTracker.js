const {TOKEN_PROGRAM_ADDRESS} = require('@solana-program/token')
const {buffer} = require('buffer')
const {mainnet, createSolanaRpc, address, getsig } = require('@solana/web3.js');
const { default: axios } = require('axios');
const { response } = require('express');
const { type } = require('os');

//
// Instruction layout for SPL Token Program
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
};



class solanaTokenTracker {
    constructor(url = 'https://mainnet.helius-rpc.com/?api-key=8bb98b5c-4864-4f7d-bcfe-1dada6f44cca'){
        this.rpc = createSolanaRpc(mainnet(url));
        this.jupiterApi = 'https://price.jup.ag/v4';
        this.raydiumApi = 'https://api.raydium.io/v2';
        this.TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

        
    }

    async getTokenAccount(walletAddress, tokenAccount){
        const ownerPublicKey = address(walletAddress);
        const mintAccount = address(tokenAccount);

        try {
            const tokenAccounts = await this.rpc.getTokenAccountsByOwner(
                ownerPublicKey,
                { mint: mintAccount},
                { encoding: 'jsonParsed'}
            ).send()

            if(tokenAccount.length === 0){
                return null
            }

            console.log("Token accounts:", tokenAccounts);
            console.log("First element:", tokenAccounts.value[0]);
            console.log("Pubkey:", tokenAccounts.value[0].pubkey);

            

            //return the first account found(usally there's only one per token)
            return {
                pubKey: tokenAccounts.value[0].pubkey,
                accountInfo: tokenAccounts.value[0].account,


            }
            
        } catch (error) {
            console.error('Error getting token account:', error);
            return null;
        }
    }

    async getTokenTransactions(walletAddress, tokenAddress){

        try {
            //first, get the token account
            const tokenAccount = await this.getTokenAccount(walletAddress, tokenAddress);

            if (!tokenAccount) {
                console.log("No token account found")
                return []
            }

            console.log("Token Account Public Key:", tokenAccount.pubKey);
        
    

            //get all signatures for the token account
            let allSignatures = [];
            let beforeSignature = undefined;

            while (true) {
                const signatures = await this.connection.getSignaturesForAddress(
                    tokenAccount.pubkey,
                    {
                        before: beforeSignature,
                        limit: 1000,
                    }
                );
                
                console.log("Signatures response:", signatures);
                

                if (signatures.length === 0) break

                allSignatures.push(...signatures)
                beforeSignature = signatures[signatures.length - 1].signature;

                if (signatures.length < 1000) break;

            }

            //process each signature to get transaction details
            const transactions = await Promise.all(
            allSignatures.map(async (sigInfo) => {
                try {
                    const tx = await this.rpc.getTransaction(sigInfo.signature, {
                        maxSupportedTransactionVersion: 0
                    });

                    if (!tx) return null;

                    //parse the transaction to find token transfer
                    const transferInfo = await this._parseTokenTransfer(tx, tokenAccount.pubKey);

                    if(!transferInfo) return null;
                    return {
                        signature: sigInfo.signature,
                        timestamp: new Date(tx.blocktime * 1000),
                        amount: transferInfo.amount,
                        transactionType: transferInfo.type,
                        slot: tx.slot,
                        fee: tx.meta.fee,
                        //include raw transfer info for debugging
                        transferDetails: transferInfo

                    }
                } catch (error) {
                    console.error(`Error processing transaction ${sigInfo.signature}:`, error);
                    return null;
                }
            }))

            //filter out null results and sort by timestamp
            return transactions
                .filter(tx => tx !== null)
                .sort((a, b) => a.timestamp - b.timestamp);
        
        
        } catch (error) {
            console.error('Error fetching token transactions:', error);
            return [];
        }
    }

    async analyzeTokenHistory(walletAddress, tokenAddress) {
        try {
            console.log('Fetching token transactions...')
            const transactions = await this.getTokenTransactions(walletAddress, tokenAddress);

            console.log(`Found ${transactions.length} transactions`);
            
            // Analyze the transactions
            const summary = {
                totalBuys: transactions.filter(tx => tx.transactionType === 'buy').length,
                totalSells: transactions.filter(tx => tx.transactionType === 'sell').length,
                firstTransaction: transactions[0],
                lastTransaction: transactions[transactions.length - 1],
                totalFees: transactions.reduce((sum, tx) => sum + tx.fee, 0)
            };

            return summary;

        } catch (error) {
            console.error('Error analyzing token history:', error);
            return null;
        }
        
    }

    
    
}

// Example usage
async function main() {
    const tracker = new solanaTokenTracker();
    
    const walletAddress = '3kZjv4QP2ZA6Zk167zaBRDiSdEyuq6GnnvQRvTr3rvuT';
    const tokenAddress = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr';
    
    try {
        const summary = await tracker.analyzeTokenHistory(walletAddress, tokenAddress);
        if (summary) {
            console.log('Transaction Summary:', {
                'Total Buy Transactions': summary.totalBuys,
                'Total Sell Transactions': summary.totalSells,
                'First Transaction Date': summary.firstTransaction.timestamp,
                'Last Transaction Date': summary.lastTransaction.timestamp,
                'Total Fees Paid (SOL)': summary.totalFees / 1e9
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { solanaTokenTracker };
