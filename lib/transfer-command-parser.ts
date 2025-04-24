import { detectSolanaAddress, getCanonicalAddress } from './wallet-address-utils';

export interface TransferIntent {
  action: 'send';
  recipient: string;
  amount: number;
  token: string;
}

/**
 * Parse a natural language command for transferring tokens
 * @param text - The user's input text
 * @returns A transfer intent object if detected, otherwise null
 */
export function parseTransferCommand(text: string): TransferIntent | null {
  if (!text) return null;
  
  // Keep original case for addresses
  const originalText = text;
  
  // Check if this is a transfer command
  const isTransferCommand = /\b(send|transfer|pay|give)\b/i.test(originalText);
  if (!isTransferCommand) return null;
  
  // Extract the recipient address - preserve case
  const recipientAddress = detectSolanaAddress(originalText);
  if (!recipientAddress) return null;

  // Get canonical form of the address
  const canonicalAddress = getCanonicalAddress(recipientAddress);
  if (!canonicalAddress) {
    console.error("Invalid recipient address:", recipientAddress);
    return null;
  }
  
  // Extract amount and token
  // Pattern for matching patterns like "0.1 SOL", "1.5 USDC", etc.
  const amountTokenPattern = /\b(\d+\.?\d*)\s*(sol|usdc|usdt|bonk|jup|jto|ray|pyth|meme|wif)\b/i;
  const amountTokenMatch = originalText.match(amountTokenPattern);
  
  if (!amountTokenMatch) return null;
  
  const amount = parseFloat(amountTokenMatch[1]);
  const token = amountTokenMatch[2].toUpperCase();
  
  // Validate amount
  if (isNaN(amount) || amount <= 0) return null;
  
  return {
    action: 'send',
    recipient: canonicalAddress, // Use canonical form
    amount,
    token
  };
}
