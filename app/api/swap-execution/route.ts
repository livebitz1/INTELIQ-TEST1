import { NextRequest, NextResponse } from 'next/server';
import { AutoSwapService } from '@/lib/auto-swap-service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { intent, walletData } = data;
    
    // Validate the request data
    if (!intent || !intent.fromToken || !intent.toToken || !intent.amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid swap request. Missing required parameters."
        },
        { status: 400 }
      );
    }
    
    // Since we can't access the wallet directly in the API route,
    // we'll validate the request and return estimated data
    const validation = AutoSwapService.validateSwapRequest(intent, walletData);
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.reason
        },
        { status: 400 }
      );
    }
    
    // Get swap estimate
    const estimate = await AutoSwapService.getSwapEstimate(intent);
    
    return NextResponse.json({
      success: true,
      message: "Swap request is valid and ready for execution",
      estimate,
      intent
    });
    
  } catch (error: any) {
    console.error("Error in swap execution API:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error processing swap request: ${error?.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
