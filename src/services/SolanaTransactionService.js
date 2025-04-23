import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  Token, 
  TOKEN_PROGRAM_ID, 
  createTransferInstruction 
} from '@solana/spl-token';

class SolanaTransactionService {
  constructor(connection) {
    this.connection = connection || new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    this.tokenMap = {
      'SOL': null, // Native SOL
      'USDC': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      'USDT': new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
      // Add other tokens as needed
    };
  }

  /**
   * Check if user has sufficient balance for a transaction
   */
  async checkBalance(walletAddress, token, amount) {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      if (token === 'SOL') {
        const balance = await this.connection.getBalance(publicKey);
        return {
          hasEnough: balance / LAMPORTS_PER_SOL >= amount,
          balance: balance / LAMPORTS_PER_SOL
        };
      } else {
        const tokenMint = this.tokenMap[token];
        if (!tokenMint) {
          throw new Error(`Unsupported token: ${token}`);
        }

        const accounts = await this.connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: tokenMint }
        );

        if (accounts.value.length === 0) {
          return { hasEnough: false, balance: 0 };
        }

        // Find account with highest balance
        let maxBalance = 0;
        for (const account of accounts.value) {
          const tokenAmount = account.account.data.parsed.info.tokenAmount;
          const balance = tokenAmount.uiAmount;
          if (balance > maxBalance) maxBalance = balance;
        }

        return {
          hasEnough: maxBalance >= amount,
          balance: maxBalance
        };
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      throw new Error(`Failed to check balance: ${error.message}`);
    }
  }

  /**
   * Create a transaction for sending tokens
   */
  async createTransaction(fromWallet, toAddress, token, amount) {
    try {
      const recipient = new PublicKey(toAddress);
      const sender = new PublicKey(fromWallet);

      if (token === 'SOL') {
        // SOL transfer
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: recipient,
            lamports: amount * LAMPORTS_PER_SOL,
          })
        );

        transaction.feePayer = sender;
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        return transaction;
      } else {
        // SPL Token transfer
        const tokenMint = this.tokenMap[token];
        if (!tokenMint) {
          throw new Error(`Unsupported token: ${token}`);
        }

        // Find sender's token account
        const sourceAccounts = await this.connection.getParsedTokenAccountsByOwner(
          sender,
          { mint: tokenMint }
        );
        
        if (sourceAccounts.value.length === 0) {
          throw new Error(`No ${token} account found for sender`);
        }

        // Get recipient's token account or create one if needed
        let destinationAccount;
        try {
          const destAccounts = await this.connection.getParsedTokenAccountsByOwner(
            recipient,
            { mint: tokenMint }
          );
          
          if (destAccounts.value.length > 0) {
            destinationAccount = new PublicKey(destAccounts.value[0].pubkey);
          } else {
            throw new Error(`Recipient doesn't have a ${token} account`);
          }
        } catch (error) {
          throw new Error(`Error finding recipient's token account: ${error.message}`);
        }

        const sourceAccount = new PublicKey(sourceAccounts.value[0].pubkey);
        const decimals = sourceAccounts.value[0].account.data.parsed.info.tokenAmount.decimals;
        const amountInSmallestUnit = amount * Math.pow(10, decimals);

        const transaction = new Transaction().add(
          createTransferInstruction(
            sourceAccount,
            destinationAccount,
            sender,
            parseInt(amountInSmallestUnit),
            [],
            TOKEN_PROGRAM_ID
          )
        );

        transaction.feePayer = sender;
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        return transaction;
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Get Solana Explorer URL for a transaction
   */
  getExplorerUrl(signature, cluster = 'mainnet-beta') {
    return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
  }
}

export default SolanaTransactionService;
