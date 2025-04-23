import { PublicKey } from '@solana/web3.js';

/**
 * Detects if a string contains a valid Solana wallet address
 * @param {string} text - The text to scan for wallet addresses
 * @returns {string|null} - The first valid Solana address found or null
 */
export const detectSolanaAddress = (text) => {
  if (!text) return null;
  
  // Base58 character set (Solana addresses use base58)
  const base58Regex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(base58Regex);
  
  if (!matches) return null;
  
  // Validate each match as a Solana public key
  for (const match of matches) {
    try {
      new PublicKey(match);
      return match; // Return the first valid address
    } catch (error) {
      continue; // Not a valid Solana address
    }
  }
  
  return null;
};

/**
 * Validates if a string is a valid Solana address
 * @param {string} address - The address to validate
 * @returns {boolean} - Whether the address is valid
 */
export const isValidSolanaAddress = (address) => {
  if (!address) return false;
  
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};
