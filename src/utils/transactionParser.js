import { detectSolanaAddress } from './walletAddressUtils';

/**
 * Extracts transaction information from natural language text
 * @param {string} text - The natural language command
 * @returns {Object|null} - Transaction details or null if not a transaction request
 */
export const parseTransactionRequest = (text) => {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // Check if this is a transaction request
  const isTransferRequest = /\b(send|transfer|pay|give)\b/.test(lowerText);
  if (!isTransferRequest) return null;
  
  // Extract destination address
  const address = detectSolanaAddress(text);
  if (!address) return null;
  
  // Extract amount and token
  const amountTokenRegex = /\b(\d+\.?\d*)\s*(sol|usdc|usdt|bnb|eth|btc)\b/i;
  const amountTokenMatch = lowerText.match(amountTokenRegex);
  
  if (!amountTokenMatch) return null;
  
  const amount = parseFloat(amountTokenMatch[1]);
  const token = amountTokenMatch[2].toUpperCase();
  
  if (isNaN(amount) || amount <= 0) return null;
  
  return {
    type: 'transaction',
    address,
    amount,
    token,
    originalText: text
  };
};
