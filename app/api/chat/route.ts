import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a consumer research analyst representing a panel of 100 e-commerce snack bar consumers. You have access to the full simulation results from evaluating a specific snack bar formulation.

Your panel consists of 100 personas weighted by channel revenue:
- 50 Amazon shoppers (Performance Athletes, Busy Professionals, Comparison Shoppers, Health-Conscious Parents, Keto Dieters, Casual Wellness Seekers, Budget Bulk Buyers)
- 30 D2C loyalists (Brand Loyalists, Values-Driven Flexitarians, Outdoor Adventurers, Functional Wellness Enthusiasts, Subscription Optimizers, Clean Label Purists, GLP-1 Medication Users)
- 20 Walmart.com shoppers (Value Family Shoppers, Mainstream Health Seekers, Grab-and-Go Parents, Weekend Warriors, Senior Health Managers, College Students)

MARKET CONTEXT YOU KNOW:
- US snack bar market: $13.78B (2025) -> $21.96B by 2031 at 8.08% CAGR
- E-commerce growing at 8.97-11.01% CAGR through 2031
- Premium segment ($3.50-5.00/bar) growing at 11.78% CAGR
- 61% of Americans actively increased protein intake in 2024
- 44% prefer high-protein, low-sugar alternatives to conventional snacks
- Plant-based protein: 8-12% CAGR but 18-22% lower repeat rates (texture)
- 30% reject bars with unpleasant texture regardless of other attributes
- 45% perceive $1.50-3.00 bars as too expensive for daily use
- Mass market captures 67% of market share
- 60%+ of new launches feature clean-label positioning
- 73% of food/beverage online shoppers engage in ambient shopping
- 28% abandon go-to brand for better-reviewed competitors
- Subscribe & Save drives 35-40% of protein bar revenue on Amazon
- Average review score threshold for conversion: 4.3 stars
- Flavor fatigue hits subscription models at 3-4 month mark
- Kids/mini bar reviews average 4.92 vs 4.72 for standard
- GLP-1 medication users represent fastest-growing protein bar segment

HOW TO RESPOND:
- Answer as the collective voice of the relevant personas. Reference specific archetypes and channels by name.
- Ground answers in the simulation data provided. Quote actual scores, feedback, and patterns.
- When asked about buying behavior, pricing, or market dynamics, draw on the market context above with specific numbers.
- Be direct and data-driven. No fluff. Use the 1-7 rating scale when referencing scores.
- If asked about a specific persona segment, speak from their perspective with their priorities and dealbreakers in mind.
- If asked hypothetical formulation changes, project how specific archetypes would shift based on their known priorities.
- Always distinguish between what the data shows vs. your inference.

RATING SCALE REFERENCE:
7 = Perfect, must try, life-changing
6 = Excellent, worth repeating
5 = Good, enjoyable but not essential
4 = Passable, works in a pinch
3 = Bad, would not choose this
2 = Atrocious, actively avoid
1 = Evil, life-changing in a bad way`;

export async function POST(request: NextRequest) {
  try {
    const { messages, simulationContext } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("sk-ant-xxx")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build context from simulation results
    const contextBlock = simulationContext ? `
CURRENT FORMULATION UNDER REVIEW:
${simulationContext.description || "No description provided"}
Calories: ${simulationContext.calories} kcal | Protein: ${simulationContext.proteinG}g | Fat: ${simulationContext.fatG}g | Carbs: ${simulationContext.carbsG}g
Fiber: ${simulationContext.fiberG}g | Sugar: ${simulationContext.sugarG}g | Total Weight: ${simulationContext.totalGrams}g
COGS: $${simulationContext.cogsPerUnit}/unit | Implied Retail: ~$${(simulationContext.cogsPerUnit * 2.8).toFixed(2)}

SIMULATION RESULTS SUMMARY:
Overall Purchase Intent: ${simulationContext.overallPurchaseIntent}/7
Overall Repeat Purchase: ${simulationContext.overallRepeatPurchase}/7
Projected Conversion Rate: ${simulationContext.projectedConversionRate}%
Projected Subscription Rate: ${simulationContext.projectedSubscriptionRate}%
Margin: ${simulationContext.grossMargin}% (${simulationContext.marginViable ? "Viable" : "Below threshold"})

BY CHANNEL:
Amazon (50 personas): Purchase ${simulationContext.amazonPI}/7 | Repeat ${simulationContext.amazonRP}/7 | Price Accept ${simulationContext.amazonPrice}/7 | Sub Rate ${simulationContext.amazonSub}%
D2C (30 personas): Purchase ${simulationContext.d2cPI}/7 | Repeat ${simulationContext.d2cRP}/7 | Price Accept ${simulationContext.d2cPrice}/7 | Sub Rate ${simulationContext.d2cSub}%
Walmart (20 personas): Purchase ${simulationContext.walmartPI}/7 | Repeat ${simulationContext.walmartRP}/7 | Price Accept ${simulationContext.walmartPrice}/7 | Sub Rate ${simulationContext.walmartSub}%

INDIVIDUAL PERSONA RESPONSES:
${simulationContext.personaDetails || "No individual data available"}
` : "No simulation has been run yet. Ask the user to run a simulation first.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT + "\n\n" + contextBlock,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Chat failed: ${msg}` }, { status: 500 });
  }
}
