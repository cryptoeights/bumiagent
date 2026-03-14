import { ethers } from 'ethers';
import { encryptPrivateKey } from './crypto.js';

export interface GeneratedWallet {
  address: string;
  privateKey: string; // Raw — returned to user ONCE at deploy time
  encryptedPrivateKey: string;
}

/**
 * Generate a new random wallet and encrypt the private key.
 */
export function generateAgentWallet(): GeneratedWallet {
  const wallet = ethers.Wallet.createRandom();
  const encrypted = encryptPrivateKey(wallet.privateKey);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    encryptedPrivateKey: encrypted,
  };
}
