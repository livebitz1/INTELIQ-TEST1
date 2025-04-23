import { NextResponse } from "next/server";
import { exportTrainingData, getPatternSuggestions } from "@/lib/ai-training";

// Simple admin endpoint to check AI performance
// In production, this would be protected by authentication
export async function GET() {
  try {
    const data = exportTrainingData();
    
    // Calculate statistics
    const totalInteractions = data.length;
    const successfulInteractions = data.filter(d => d.successful).length;
    const successRate = totalInteractions > 0 
      ? (successfulInteractions / totalInteractions * 100).toFixed(2)
      : "0.00";
    
    // Get intent distribution
    const intentMap: Record<string, number> = {};
    data.forEach(interaction => {
      const intent = interaction.matchedIntent || "unknown";
      intentMap[intent] = (intentMap[intent] || 0) + 1;
    });
    
    // Get pattern suggestions for improvement
    const patternSuggestions = getPatternSuggestions();
    
    return NextResponse.json({
      totalInteractions,
      successfulInteractions,
      successRate: `${successRate}%`,
      intentDistribution: intentMap,
      patternSuggestions,
      recentInteractions: data.slice(-10).reverse(),
    });
  } catch (error) {
    console.error("Error generating AI stats:", error);
    return NextResponse.json(
      { error: "Failed to generate AI statistics" },
      { status: 500 }
    );
  }
}
