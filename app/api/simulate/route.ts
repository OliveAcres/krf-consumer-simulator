import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generatePersonas } from "@/lib/personas";
import { Formulation, PersonaResponse, SimulationResult, SimulationSummary, ChannelSummary, ArchetypeSummary } from "@/lib/types";

const SYSTEM_PROMPT = `You are a consumer behavior simulation engine for Kate's Real Food (KRF), an organic snack bar company. Your job is to evaluate a snack bar formulation from the perspective of specific e-commerce consumer personas.

BRAND CONTEXT:
Kate's Real Food makes organic, real-food snack bars. Brand essence: "For the Taste of Adventure." Core values: real food ingredients (nothing artificial), lasting energy, outdoor adventure, environmental stewardship ("Preserve Where You Play"). Current product lines include Energy Bars and Protein Bars. Pricing typically $2.50-4.00 per bar.

MARKET CONTEXT:
- Global protein bar market: $14-16B (2024), growing to $20-28B by 2030-2034 at 5-6.5% CAGR
- E-commerce channel growing at 6.3-6.5% CAGR, projected 39% of US market by 2025
- Premium segment ($3.50-5.00/bar) growing at 11.78% CAGR
- 61% of Americans actively increased protein intake in 2024
- 44% of global consumers prefer high-protein, low-sugar alternatives to conventional snacks
- Plant-based protein segment growing at 8-12% CAGR but has 18-22% lower repeat rates due to texture
- 30% of consumers reject bars with unpleasant texture regardless of other attributes
- 45% of consumers perceive $1.50-3.00 bars as too expensive for daily use
- Mass market bars capture 67% of market share
- Clean label: 60%+ of new launches feature clean-label positioning
- Parents buying mini/kid bars rate them 4.92 vs 4.72 for standard sizes
- 73% of food/beverage online shoppers engage in ambient shopping
- 28% abandon their go-to brand for better-reviewed competitors

EVALUATION FRAMEWORK:
For each persona, evaluate the formulation on a 1-10 scale:
10 = Perfect, must try, life-changing, go out of your way
9 = Outstanding, top-tier, would evangelize
8 = Excellent, worth repeating regularly7 = Very good, would recommend to others
6 = Good, enjoyable but not essential
5 = Average, nothing special either way
4 = Below average, would not choose again
3 = Poor, would not choose this
2 = Bad, actively avoid
1 = Terrible, would warn others away

Rate: purchaseIntent, repeatPurchase, flavorAppeal, nutritionFit, priceAcceptance
Also determine: wouldSubscribe (boolean), feedback (1-2 sentences), suggestedImprovement (1 sentence)

Be realistic and harsh where warranted. Use the full 1-10 range. A performance athlete will not rate a 8g protein bar highly. A budget family shopper will not accept $4+ COGS (implying $6+ retail). A clean label purist will reject artificial anything. Match each persona's actual priorities and dealbreakers.

IMPORTANT: You must respond with valid JSON only. No markdown, no code fences, no explanation text.`;

function buildPersonaBatch(personas: ReturnType<typeof generatePersonas>, formulation: Formulation, batchIndex: number, batchSize: number) {
  const batch = personas.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

  const personaDescriptions = batch.map((p) => (
    `ID:${p.id} | ${p.name} | ${p.channel.toUpperCase()} | ${p.archetype} | Age ${p.age} ${p.gender} | ${p.income} | Price sensitivity: ${p.pricesensitivity}
Priorities: ${p.priorities.join(", ")}
Dealbreakers: ${p.dealbreakers.join(", ")}
Context: ${p.description}`
  )).join("\n\n");

  const impliedRetail = formulation.msrpPerBar || formulation.cogsPerUnit * 2.8;
  const caloriesPerGram = formulation.totalGrams > 0 ? (formulation.calories / formulation.totalGrams).toFixed(1) : "N/A";
  const proteinPct = formulation.totalGrams > 0 ? ((formulation.proteinG / formulation.totalGrams) * 100).toFixed(0) : "N/A";
  return `FORMULATION TO EVALUATE:
Description: ${formulation.description || "No description provided"}
Calories: ${formulation.calories} kcal
Protein: ${formulation.proteinG}g
Fat: ${formulation.fatG}g
Carbs: ${formulation.carbsG}g
Fiber: ${formulation.fiberG}g
Sugar: ${formulation.sugarG}g
Total Weight: ${formulation.totalGrams}g
COGS: $${formulation.cogsPerUnit.toFixed(2)}/unit
MSRP per Bar: $${(formulation.msrpPerBar || impliedRetail).toFixed(2)}
Bar Count: ${formulation.barCount || 12}
Total MSRP: $${((formulation.msrpPerBar || impliedRetail) * (formulation.barCount || 12)).toFixed(2)}
Caloric Density: ${caloriesPerGram} kcal/g
Protein Ratio: ${proteinPct}% of weight

PERSONAS TO EVALUATE (respond for ALL ${batch.length}):

${personaDescriptions}

Respond with a JSON array of objects, one per persona. Each object must have exactly these fields:
{"personaId": number, "name": string, "channel": string, "archetype": string, "purchaseIntent": 1-10, "repeatPurchase": 1-10, "flavorAppeal": 1-10, "nutritionFit": 1-10, "priceAcceptance": 1-10, "feedback": string, "wouldSubscribe": boolean, "suggestedImprovement": string}`;
}

function computeSummary(formulation: Formulation, responses: PersonaResponse[]): SimulationSummary {
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const channelSummary = (ch: "amazon" | "d2c" | "walmart"): ChannelSummary => {
    const r = responses.filter((r) => r.channel === ch);    return {
      avgPurchaseIntent: Math.round(avg(r.map((x) => x.purchaseIntent)) * 10) / 10,
      avgRepeatPurchase: Math.round(avg(r.map((x) => x.repeatPurchase)) * 10) / 10,
      avgNutritionFit: Math.round(avg(r.map((x) => x.nutritionFit)) * 10) / 10,
      avgPriceAcceptance: Math.round(avg(r.map((x) => x.priceAcceptance)) * 10) / 10,
      subscriptionRate: Math.round((r.filter((x) => x.wouldSubscribe).length / (r.length || 1)) * 100),
      count: r.length,
    };
  };

  const archetypes = Array.from(new Set(responses.map((r) => r.archetype)));
  const byArchetype: Record<string, ArchetypeSummary> = {};
  for (const arch of archetypes) {
    const r = responses.filter((x) => x.archetype === arch);
    byArchetype[arch] = {
      avgPurchaseIntent: Math.round(avg(r.map((x) => x.purchaseIntent)) * 10) / 10,
      avgRepeatPurchase: Math.round(avg(r.map((x) => x.repeatPurchase)) * 10) / 10,
      count: r.length,
      keyFeedback: r[0]?.feedback || "",
    };
  }

  // Extract common themes from feedback
  const allFeedback = responses.map((r) => r.feedback.toLowerCase());
  const allImprovements = responses.map((r) => r.suggestedImprovement.toLowerCase());

  const concerns = allFeedback.filter((f) =>
    f.includes("sugar") || f.includes("price") || f.includes("protein") || f.includes("texture") || f.includes("artificial") || f.includes("calorie")
  ).slice(0, 5);

  const strengths = allFeedback.filter((f) =>
    f.includes("great") || f.includes("love") || f.includes("perfect") || f.includes("excellent") || f.includes("good")
  ).slice(0, 5);
  const overallPI = avg(responses.map((r) => r.purchaseIntent));
  const overallRP = avg(responses.map((r) => r.repeatPurchase));

  // Conversion rate estimation: purchase intent 6+ = potential buyer
  const potentialBuyers = responses.filter((r) => r.purchaseIntent >= 6).length;
  const conversionRate = (potentialBuyers / responses.length) * 100;

  const subscribers = responses.filter((r) => r.wouldSubscribe).length;
  const subscriptionRate = (subscribers / responses.length) * 100;

  const suggestedRetail = formulation.msrpPerBar || formulation.cogsPerUnit * 2.8;
  const grossMargin = ((suggestedRetail - formulation.cogsPerUnit) / suggestedRetail) * 100;

  return {
    overallPurchaseIntent: Math.round(overallPI * 10) / 10,
    overallRepeatPurchase: Math.round(overallRP * 10) / 10,
    byChannel: {
      amazon: channelSummary("amazon"),
      d2c: channelSummary("d2c"),
      walmart: channelSummary("walmart"),
    },
    byArchetype,
    topConcerns: concerns.length ? concerns : ["No major concerns identified"],
    topStrengths: strengths.length ? strengths : ["No strong positives identified"],
    projectedConversionRate: Math.round(conversionRate * 10) / 10,
    projectedSubscriptionRate: Math.round(subscriptionRate * 10) / 10,
    estimatedRetailPrice: Math.round(suggestedRetail * 100) / 100,
    marginAnalysis: {
      suggestedRetail: Math.round(suggestedRetail * 100) / 100,
      grossMargin: Math.round(grossMargin * 10) / 10,
      viable: grossMargin >= 50,
    },
  };
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formulation: Formulation = body;
    const requestedCount = Math.min(100, Math.max(10, body.personaCount || 100));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("sk-ant-xxx")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add your key to .env.local or Vercel environment variables." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    const allPersonas = generatePersonas();
    // Proportionally sample: 50% Amazon, 30% D2C, 20% Walmart
    const amazonCount = Math.round(requestedCount * 0.5);
    const d2cCount = Math.round(requestedCount * 0.3);
    const walmartCount = requestedCount - amazonCount - d2cCount;
    const amazonPersonas = allPersonas.filter(p => p.channel === "amazon").slice(0, amazonCount);
    const d2cPersonas = allPersonas.filter(p => p.channel === "d2c").slice(0, d2cCount);
    const walmartPersonas = allPersonas.filter(p => p.channel === "walmart").slice(0, walmartCount);
    const personas = [...amazonPersonas, ...d2cPersonas, ...walmartPersonas];

    // Process in batches of 20 to stay within token limits
    const batchSize = 20;
    const numBatches = Math.ceil(personas.length / batchSize);
    const allResponses: PersonaResponse[] = [];
    for (let i = 0; i < numBatches; i++) {
      const userPrompt = buildPersonaBatch(personas, formulation, i, batchSize);

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";

      try {
        // Strip any markdown code fences if present
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed: PersonaResponse[] = JSON.parse(cleaned);
        // Normalize channel to lowercase (Claude may return "AMAZON", "Amazon", etc.)
        for (const r of parsed) {
          r.channel = r.channel.toLowerCase() as PersonaResponse["channel"];
        }
        allResponses.push(...parsed);
      } catch (parseError) {
        console.error(`Batch ${i} parse error:`, parseError, "Raw:", text.substring(0, 200));
        // Generate fallback responses for this batch
        const batchPersonas = personas.slice(i * batchSize, (i + 1) * batchSize);
        for (const p of batchPersonas) {
          allResponses.push({
            personaId: p.id,
            name: p.name,
            channel: p.channel,
            archetype: p.archetype,            purchaseIntent: 4,
            repeatPurchase: 3,
            flavorAppeal: 4,
            nutritionFit: 4,
            priceAcceptance: 4,
            feedback: "Evaluation pending (batch processing error)",
            wouldSubscribe: false,
            suggestedImprovement: "N/A",
          });
        }
      }
    }

    const summary = computeSummary(formulation, allResponses);

    const result: SimulationResult = {
      formulation,
      responses: allResponses,
      summary,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Simulation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Simulation failed: ${message}` }, { status: 500 });
  }
}
