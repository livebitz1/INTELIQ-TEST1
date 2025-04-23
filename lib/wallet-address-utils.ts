import { PublicKey } from '@solana/web3.js';

/**
 * Detects if a string contains a valid Solana wallet address
 * @param text - The text to scan for wallet addresses
 * @returns The first valid Solana address found or null
 */
export function detectSolanaAddress(text: string): string | null {
  if (!text) return null;
  
  // Solana addresses are base58 encoded and typically 32-44 characters
  const base58Pattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(base58Pattern);
  
  if (!matches) return null;
  
  // Validate each potential address by attempting to create a PublicKey
  for (const match of matches) {
    try {
      new PublicKey(match);
      return match; // Return the first valid address
    } catch (error) {
      continue; // Not a valid Solana address
    }
  }
  
  return null;
}

/**
 * Validates if a string is a valid Solana address
 * @param address - The address to validate
 * @returns Whether the address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;
  
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format a wallet address for display (shortens it)
 * @param address - The full Solana address
 * @returns Shortened address for display
 */
export function formatWalletAddressShort(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
