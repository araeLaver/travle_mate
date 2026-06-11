import { ethers } from 'ethers';
import { query } from '../config/db';

const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/your-api-key';
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';

// Minimal ABI for minting
const ABI = [
  "function mintNFTWithLocation(address to, string memory uri, uint256 locationId, string memory locationName, string memory rarity, int256 latitude, int256 longitude) public returns (uint256)"
];

export const mintNftOnChain = async (collectionId: number) => {
  try {
    // 1. Fetch collection and location data
    const result = await query(
      `SELECT c.*, l.name as location_name, l.rarity, l.latitude, l.longitude, l.nft_metadata_uri, u.polygon_wallet_address
       FROM user_nft_collections c
       JOIN collectible_locations l ON c.location_id = l.id
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [collectionId]
    );

    const data = result.rows[0];
    if (!data || !data.polygon_wallet_address) {
      console.error('Minting failed: No data or wallet address');
      return;
    }

    // 2. Setup ethers
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    console.log(`Starting mint for user ${data.user_id} at location ${data.location_id}`);

    // 3. Call contract
    // Lat/Lng are scaled by 1e6 for solidity int256
    const tx = await contract.mintNFTWithLocation(
      data.polygon_wallet_address,
      data.nft_metadata_uri,
      data.location_id,
      data.location_name,
      data.rarity,
      Math.round(data.latitude * 1e6),
      Math.round(data.longitude * 1e6)
    );

    console.log(`Transaction sent: ${tx.hash}`);

    // 4. Update status to MINTING
    await query('UPDATE user_nft_collections SET mint_status = $1, transaction_hash = $2 WHERE id = $3', ['MINTING', tx.hash, collectionId]);

    // 5. Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log(`Transaction confirmed: ${tx.hash}`);
      await query('UPDATE user_nft_collections SET mint_status = $1 WHERE id = $2', ['MINTED', collectionId]);
    } else {
      console.error(`Transaction failed: ${tx.hash}`);
      await query('UPDATE user_nft_collections SET mint_status = $1 WHERE id = $2', ['FAILED', collectionId]);
    }

  } catch (error) {
    console.error('Minting process error:', error);
    await query('UPDATE user_nft_collections SET mint_status = $1 WHERE id = $2', ['FAILED', collectionId]);
  }
};
