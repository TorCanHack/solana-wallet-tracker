const { createSolanaRpc, address, devnet, generateKeyPair, getAddressFromPublicKey,  lamports, airdropFactory, createSolanaRpcSubscriptions } = require('@solana/web3.js');
const rpcDevnet = createSolanaRpc(devnet('https://api.devnet.solana.com'))
const rpcsubs = createSolanaRpcSubscriptions("ws://api.devnet.solana.com")
const SOL = 1_000_000_000n;
const amount = lamports(1n * SOL);
const fs = require('fs');

class DevnetWalletManager {
    constructor() {
        this.connection = rpcDevnet;
        this.airdrop = airdropFactory({ rpcDevnet, rpcsubs });
    }

    async generateWallet() {
        const keyPair = await generateKeyPair();
        return {
            publicKey: await getAddressFromPublicKey(keyPair.publicKey),
            secretKey: keyPair.secretKey
        };
    }

    saveWallet(wallet, filename = 'devnet-wallet.json') {
        const walletData = {
            publicKey: Buffer.from(wallet.publicKey).toString('base64'),
            secretKey: Buffer.from(wallet.secretKey).toString('base64')
        };
        fs.writeFileSync(filename, JSON.stringify(walletData, null, 2));
        console.log(`Wallet saved to ${filename}`);
    }

    loadWallet(filename = 'devnet-wallet.json') {
        const walletData = JSON.parse(fs.readFileSync(filename, 'utf8'));
        return {
            publicKey: Buffer.from(walletData.publicKey, 'base64'),
            secretKey: Buffer.from(walletData.secretKey, 'base64')
        };
    }

    async requestAirdrop(publicKey) {
        console.log("Requesting airdrop for:", publicKey);
        
        const signature = await this.airdrop({
            commitment: "finalized",
            recipientAddress: publicKey,
            lamports: amount
        })
            
            
        
    }

    async checkBalance(publicKey) {
        const response = await this.connection.getBalance(publicKey, { commitment: "finalized" }).send();
        const balance = response.value;
        console.log("Balance:", balance / Number(SOL), "SOL");
        return balance;
    }
}

async function main() {
    const manager = new DevnetWalletManager();
    console.log('Generating new devnet wallet...');
    const newWallet = await manager.generateWallet();
    manager.saveWallet(newWallet);
    
    console.log('Requesting Airdrop...');
    await manager.requestAirdrop(newWallet.publicKey);
    await manager.checkBalance(newWallet.publicKey);
}

main().catch(console.error);
module.exports = DevnetWalletManager;