import { NextResponse } from "next/server";
import { WalletInspector } from "@/lib/wallet-inspector";
import { WalletDataProvider } from "@/lib/wallet-data-provider";

export async function GET(request: Request) {
  // Get wallet address from URL params
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("address");

  if (!walletAddress) {
    return NextResponse.json({ 
      error: "Missing wallet address parameter" 
    }, { status: 400 });
  }

  try {
    // Check if this is a diagnostic request
    const diagnostic = searchParams.get("diagnostic") === "true";
    
    if (diagnostic) {
      // Run a full diagnostic
      const results = await WalletInspector.runDiagnostic(walletAddress);
      return NextResponse.json(results);
    } else {
      // Just fetch wallet data
      const walletData = await WalletDataProvider.getCompleteWalletData(walletAddress);
      
      return NextResponse.json({
        address: walletAddress,
        solBalance: walletData.solBalance,
        tokenCount: walletData.tokens.length,
        transactionCount: walletData.recentTransactions.length,
        tokens: walletData.tokens.map(t => ({
          symbol: t.symbol,
          balance: t.balance,
          usdValue: t.usdValue || null
        }))
      });
    }
  } catch (error) {
    console.error("Wallet check error:", error);
    return NextResponse.json({ 
      error: `Failed to check wallet: ${error instanceof Error ? error.message : 'Unknown error occurred'}` 
    }, { status: 500 });
  }
}

// Also handle POST for more detailed data fetching
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, fetchOptions } = body;
    
    if (!walletAddress) {
      return NextResponse.json({ 
        error: "Missing wallet address" 
      }, { status: 400 });
    }
    
    // Fetch specified data types
    const fetchTransactions = fetchOptions?.transactions !== false;
    const fetchTokens = fetchOptions?.tokens !== false;
    
    // Get wallet data
    const solBalance = await WalletDataProvider.getSolBalance(walletAddress);
    
    // Get other data as requested
    const [tokens, transactions] = await Promise.all([
      fetchTokens ? WalletDataProvider.getTokens(walletAddress) : Promise.resolve([]),
      fetchTransactions ? WalletDataProvider.getRecentTransactions(walletAddress) : Promise.resolve([])
    ]);
    
    return NextResponse.json({
      address: walletAddress,
      solBalance,
      tokens: fetchTokens ? tokens : undefined,
      transactions: fetchTransactions ? transactions : undefined
    });
  } catch (error) {
    console.error("Wallet check error:", error);
    return NextResponse.json({ 
      error: `Failed to check wallet: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
