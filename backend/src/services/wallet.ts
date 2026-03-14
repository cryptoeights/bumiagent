import { ethers } from 'ethers';
import { encryptPrivateKey } from './crypto.js';

export interface GeneratedWallet {
  address: string;
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
    encryptedPrivateKey: encrypted,
  };
}
