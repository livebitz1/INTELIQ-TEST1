import { PublicKey } from '@solana/web3.js';

/**
 * Detects if a string contains a valid Solana wallet address
 * @param text - The text to scan for wallet addresses
 * @returns The first valid Solana address found or null
 */
export function detectSolanaAddress(text: string): string | null {
  if (!text) return null;
  
  // Solana addresses are base58 encoded and typically 32-44 characters
  // Use case-sensitive pattern to preserve original case
  const base58Pattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(base58Pattern);
  
  if (!matches) return null;
  
  // Validate each potential address by attempting to create a PublicKey
  for (const match of matches) {
    try {
      const pubkey = new PublicKey(match);
      // Get the canonical form of the address
      const canonicalAddress = pubkey.toBase58();
      
      // If the case doesn't match but it's a valid address, use the canonical form
      if (canonicalAddress !== match) {
        console.warn(`Address case mismatch, using canonical form: ${canonicalAddress}`);
        return canonicalAddress;
      }
      
      // Return the original case if it matches the canonical form
      return match;
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
    const pubkey = new PublicKey(address);
    // Verify the address by encoding it back to base58
    const canonicalAddress = pubkey.toBase58();
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

/**
 * Get the canonical form of a Solana address
 * @param address - The address to canonicalize
 * @returns The canonical form of the address or null if invalid
 */
export function getCanonicalAddress(address: string): string | null {
  if (!address) return null;
  
  try {
    // Remove any whitespace
    const cleanAddress = address.trim();
    // Create PublicKey and get canonical form
    const pubkey = new PublicKey(cleanAddress);
    return pubkey.toBase58();
  } catch (error) {
    console.error("Error canonicalizing address:", error);
    return null;
  }
}

/**
 * Validate and format a Solana address for display
 * @param address - The address to validate and format
 * @returns Object containing validation result and formatted address
 */
export function validateAndFormatAddress(address: string): {
  isValid: boolean;
  canonicalAddress: string | null;
  displayAddress: string;
  error?: string;
} {
  if (!address) {
    return {
      isValid: false,
      canonicalAddress: null,
      displayAddress: '',
      error: 'Address is required'
    };
  }

  try {
    const cleanAddress = address.trim();
    const pubkey = new PublicKey(cleanAddress);
    const canonicalAddress = pubkey.toBase58();
    
    return {
      isValid: true,
      canonicalAddress,
      displayAddress: formatWalletAddressShort(canonicalAddress)
    };
  } catch (error) {
    return {
      isValid: false,
      canonicalAddress: null,
      displayAddress: formatWalletAddressShort(address),
      error: 'Invalid Solana address'
    };
  }
}
