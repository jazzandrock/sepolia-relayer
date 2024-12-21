require('dotenv').config();
const { ethers } = require('ethers');

// Load environment variables
const {
  PRIVATE_KEY,
  ARBITRUM_SEPOLIA_RPC,
  BASE_SEPOLIA_RPC,
  ARBITRUM_CONTRACT_ADDRESS,
  BASE_CONTRACT_ADDRESS,
} = process.env;

// Replace with your actual ABI, which must include 'Deposited' event & 'executeTx' function
const contractAbi = [
  "event Deposited(bytes32 indexed resourceId, address indexed user, uint256 amount, uint64 destChainId)",
  "function executeTx(bytes32 originalTxHash, bytes32 resourceId, address user, uint256 amount) external"
];

// 1. Providers
const arbitrumProvider = new ethers.WebSocketProvider(ARBITRUM_SEPOLIA_RPC);
const baseProvider = new ethers.WebSocketProvider(BASE_SEPOLIA_RPC);

// 2. Wallets (signers)
const arbitrumWallet = new ethers.Wallet(PRIVATE_KEY, arbitrumProvider);
const baseWallet = new ethers.Wallet(PRIVATE_KEY, baseProvider);

// 3. Contracts (connected with signers)
const arbitrumContract = new ethers.Contract(ARBITRUM_CONTRACT_ADDRESS, contractAbi, arbitrumWallet);
const baseContract = new ethers.Contract(BASE_CONTRACT_ADDRESS, contractAbi, baseWallet);

// 4. Listen for Deposited events on Arbitrum Sepolia
arbitrumContract.on('Deposited', async (resourceId, user, amount, destChainId, event) => {
  try {
    console.log('Arbitrum -> Deposited event detected!');
    console.log(`resourceId: ${resourceId}`);
    console.log(`user: ${user}`);
    console.log(`amount: ${amount.toString()}`);
    console.log(`destChainId: ${destChainId.toString()}`);

    // originalTxHash can be derived from event.transactionHash or the log
    const originalTxHash = event.transactionHash;

    if (destChainId.toString() === "84532") {
      console.log("Destination chain is Base Sepolia, calling executeTx on Base...");

      // Send executeTx on Base
      const tx = await baseContract.executeTx(
        originalTxHash,
        resourceId,
        user,
        amount
      );
      console.log('executeTx() tx hash (Base):', tx.hash);

      const receipt = await tx.wait();
      console.log('executeTx() confirmed on Base:', receipt.transactionHash);
    }
  } catch (error) {
    console.error('Error handling Arbitrum Deposited event:', error);
  }
});

// 5. Listen for Deposited events on Base Sepolia
baseContract.on('Deposited', async (resourceId, user, amount, destChainId, event) => {
  try {
    console.log('Base -> Deposited event detected!');
    console.log(`resourceId: ${resourceId}`);
    console.log(`user: ${user}`);
    console.log(`amount: ${amount.toString()}`);
    console.log(`destChainId: ${destChainId.toString()}`);

    // originalTxHash can be derived from event.transactionHash or the log
    const originalTxHash = event.transactionHash;

    // If the destination chain is Arbitrum (just an example, chainId can vary)
    // For demonstration, let's assume Arbitrum Sepolia chainId is 421613
    if (destChainId.toString() === "421613") {
      console.log("Destination chain is Arbitrum Sepolia, calling executeTx on Arbitrum...");

      // Send executeTx on Arbitrum
      const tx = await arbitrumContract.executeTx(
        originalTxHash,
        resourceId,
        user,
        amount
      );
      console.log('executeTx() tx hash (Arbitrum):', tx.hash);

      const receipt = await tx.wait();
      console.log('executeTx() confirmed on Arbitrum:', receipt.transactionHash);
    }
  } catch (error) {
    console.error('Error handling Base Deposited event:', error);
  }
});

console.log('Listening for Deposited events on both Arbitrum Sepolia and Base Sepolia...');
