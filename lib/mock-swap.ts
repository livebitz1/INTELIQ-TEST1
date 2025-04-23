import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

/**
 * Creates a mock swap transaction for testing
 * This helps isolate Jupiter API issues during development
 */
export function createMockSwapTransaction(
  walletAddress: string,
  fromToken: string,
  toToken: string,
  amount: string,
  connection: Connection
): Promise<Transaction> {
  return new Promise<Transaction>(async (resolve) => {
    console.log(`Creating mock swap: ${amount} ${fromToken} to ${toToken}`);
    
    // Create a simple transaction
    const transaction = new Transaction();
    
    // Add the wallet as the fee payer
    transaction.feePayer = new PublicKey(walletAddress);
    
    // Get a recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    
    // Add a memo instruction to simulate the swap
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(`Mock swap: ${amount} ${fromToken} to ${toToken}`, 'utf8'),
      })
    );
    
    // Simulate network delay
    setTimeout(() => {
      resolve(transaction);
    }, 500);
  });
}

/**
 * Create mock quote response that works with our system
 */
export function createMockSwapQuote(
  fromToken: string, 
  toToken: string, 
  amount: string
): any {
  const inputDecimals = fromToken === 'SOL' ? 9 : 6;
  const outputDecimals = toToken === 'SOL' ? 9 : 6;
  
  const inputAmount = parseFloat(amount) * Math.pow(10, inputDecimals);
  
  // Calculate a realistic output amount
  let rate = 1.0;
  if (fromToken === 'SOL' && toToken === 'USDC') {
    rate = 100;  // 1 SOL = $100 USDC
  } else if (fromToken === 'USDC' && toToken === 'SOL') {
    rate = 0.01; // 100 USDC = 1 SOL
  } else if (fromToken === 'SOL' && toToken === 'BONK') {
    rate = 5000000; // 1 SOL = 5,000,000 BONK
  }
  
  const outputAmount = parseFloat(amount) * rate * Math.pow(10, outputDecimals);
  
  return {
    inputMint: fromToken,
    outputMint: toToken,
    inAmount: inputAmount.toString(),
    outAmount: outputAmount.toString(),
    otherAmountThreshold: "0",
    swapMode: "ExactIn",
    slippageBps: 50,
    platformFee: null,
    priceImpactPct: "0.1",
    contextSlot: 12345678,
    timeTaken: 0.5,
  };
}
