import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const CHAT_SYSTEM_PROMPT = `You are the KRF Consumer Intelligence Engine, an expert analyst for Kate's Real Food (organic snack bar company). You have access to a complete consumer simulation with 100 e-commerce personas who have evaluated a specific bar formulation.

BRAND CONTEXT:
Kate's Real Food makes organic, real-food snack bars. Brand essence: "For the Taste of Adventure." Core values: real food ingredients, lasting energy, outdoor adventure, environmental stewardship ("Preserve Where You Play"). Product lines: Energy Bars and Protein Bars. Typical pricing $2.50-4.00/bar.

MARKET INTELLIGENCE:
- US snack bar market: ~$13.78B, growing at 3.5% CAGR
- Global protein bar market: $14-16B (2024), projected $20-28B by 2030-2034 at 5-6.5% CAGR
- E-commerce channel growing at 6.3-6.5% CAGR, projected 39% of US market by 2025
- Premium segment ($3.50-5.00/bar) growing at 11.78% CAGR
- 61% of Americans actively increased protein intake in 2024
- 44% of global consumers prefer high-protein, low-sugar alternatives
- Plant-based protein segment growing at 8-12% CAGR but 18-22% lower repeat rates due to texture
- 30% of consumers reject bars with unpleasant texture regardless of other attributes
- 45% of consumers perceive $1.50-3.00 bars as too expensive for daily use
- Mass market bars capture 67% of market share
- Clean label: 60%+ of new launches feature clean-label positioning
- 73% of food/beverage online shoppers engage in ambient shopping
- 28% abandon go-to brand for better-reviewed competitors

YOUR ROLE:
Answer R&D questions by analyzing the simulation data. Reference specific personas, segments, and scores. Be direct, data-driven, and actionable. Use the 1-10 rating scale context (10=perfect/life-changing, 6=good/enjoyable, 5=average, 1=terrible). When discussing pricing, use the 2.8x COGS-to-retail markup model.

Give concrete recommendations grounded in the persona data. Identify which segments are enthusiastic vs hostile to the formulation. Call out dealbreakers and opportunities. Think like a CPG strategist advising an R&D team.

If no simulation data is provided, you can still answer general questions about KRF brand strategy, snack bar market dynamics, formulation advice, and competitive positioning using your market intelligence.`;
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SimulationContext {
  formulation: Record<string, unknown>;
  summary: Record<string, unknown>;
  personaDetails: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { messages, simulationContext }: { messages: ChatMessage[]; simulationContext: SimulationContext } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("sk-ant-xxx")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build context block from simulation results
    let contextBlock = "";
    if (simulationContext) {
      contextBlock = `\n\nSIMULATION DATA:\n`;
      contextBlock += `\nFormulation: ${JSON.stringify(simulationContext.formulation, null, 2)}`;      contextBlock += `\n\nSummary Metrics: ${JSON.stringify(simulationContext.summary, null, 2)}`;

      if (simulationContext.personaDetails?.length) {
        contextBlock += `\n\nIndividual Persona Responses (${simulationContext.personaDetails.length} personas):`;
        for (const detail of simulationContext.personaDetails) {
          contextBlock += `\n${detail}`;
        }
      }
    }

    const systemPrompt = CHAT_SYSTEM_PROMPT + contextBlock;

    const anthropicMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Chat failed: ${message}` }, { status: 500 });
  }
}
