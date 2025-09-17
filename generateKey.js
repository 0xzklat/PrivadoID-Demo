const { Wallet } = require('ethers');

// Generate a random wallet
const wallet = Wallet.createRandom();
console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
