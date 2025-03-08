const DevnetWalletManager = require('../utility/devnetmanager');

const setup = async () => {
    const manager = new DevnetWalletManager();
    const wallet = await manager.generateWallet();
    console.log('New Devnet Wallet:', wallet.publicKey);
    await manager.requestAirdrop(wallet.publicKey);
}

setup().catch(console.error);