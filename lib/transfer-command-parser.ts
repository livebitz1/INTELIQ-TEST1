import { detectSolanaAddress } from './wallet-address-utils';

export interface TransferIntent {
  action: 'transfer';
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
  
  const lowerText = text.toLowerCase();
  
  // Check if this is a transfer command
  const isTransferCommand = /\b(send|transfer|pay|give)\b/i.test(lowerText);
  if (!isTransferCommand) return null;
  
  // Extract the recipient address
  const recipientAddress = detectSolanaAddress(text);
  if (!recipientAddress) return null;
  
  // Extract amount and token
  // Pattern for matching patterns like "0.1 SOL", "1.5 USDC", etc.
  const amountTokenPattern = /\b(\d+\.?\d*)\s*(sol|usdc|usdt|bonk|jup|jto|ray|pyth|meme|wif)\b/i;
  const amountTokenMatch = lowerText.match(amountTokenPattern);
  
  if (!amountTokenMatch) return null;
  
  const amount = parseFloat(amountTokenMatch[1]);
  const token = amountTokenMatch[2].toUpperCase();
  
  // Validate amount
  if (isNaN(amount) || amount <= 0) return null;
  
  return {
    action: 'transfer',
    recipient: recipientAddress,
    amount,
    token
  };
}
