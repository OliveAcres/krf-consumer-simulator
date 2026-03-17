"use client";

import { useState, useRef, useEffect } from "react";
import { SimulationResult } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSimulationContext(result: SimulationResult) {
  const { formulation, summary, responses } = result;
  const personaDetails = responses
    .map((r) => `[${r.channel.toUpperCase()}] ${r.name} (${r.archetype}): PI=${r.purchaseIntent} RP=${r.repeatPurchase} Flavor=${r.flavorAppeal} Nutrition=${r.nutritionFit} Price=${r.priceAcceptance} Sub=${r.wouldSubscribe} | "${r.feedback}" | Suggestion: "${r.suggestedImprovement}"`)
    .join("\n");

  return {
    description: formulation.description,
    calories: formulation.calories,
    proteinG: formulation.proteinG,
    fatG: formulation.fatG,
    carbsG: formulation.carbsG,
    fiberG: formulation.fiberG,
    sugarG: formulation.sugarG,
    totalGrams: formulation.totalGrams,
    cogsPerUnit: formulation.cogsPerUnit,
    overallPurchaseIntent: summary.overallPurchaseIntent,
    overallRepeatPurchase: summary.overallRepeatPurchase,
    projectedConversionRate: summary.projectedConversionRate,
    projectedSubscriptionRate: summary.projectedSubscriptionRate,
    grossMargin: summary.marginAnalysis.grossMargin,
    marginViable: summary.marginAnalysis.viable,
    amazonPI: summary.byChannel.amazon.avgPurchaseIntent,
    amazonRP: summary.byChannel.amazon.avgRepeatPurchase,
    amazonPrice: summary.byChannel.amazon.avgPriceAcceptance,
    amazonSub: summary.byChannel.amazon.subscriptionRate,
    d2cPI: summary.byChannel.d2c.avgPurchaseIntent,
    d2cRP: summary.byChannel.d2c.avgRepeatPurchase,
    d2cPrice: summary.byChannel.d2c.avgPriceAcceptance,
    d2cSub: summary.byChannel.d2c.subscriptionRate,
    walmartPI: summary.byChannel.walmart.avgPurchaseIntent,
    walmartRP: summary.byChannel.walmart.avgRepeatPurchase,
    walmartPrice: summary.byChannel.walmart.avgPriceAcceptance,
    walmartSub: summary.byChannel.walmart.subscriptionRate,
    personaDetails,
  };
}

const STARTER_PROMPTS = [
  "Which persona segments are most likely to churn after first purchase and why?",
  "What formulation change would have the biggest impact on Walmart conversion?",
  "How would the D2C loyalists react if we doubled the protein and raised COGS by $0.40?",
  "What price point maximizes subscription revenue across all channels?",
  "Which archetypes have the biggest gap between purchase intent and repeat purchase?",
];

export default function ChatPanel({ result }: { result: SimulationResult }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: ChatMessage = { role: "user", content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          simulationContext: buildSimulationContext(result),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ background: "linear-gradient(135deg, #00411E 0%, #006B32 100%)" }}>
        <h3 className="text-sm font-semibold text-white">Ask the Panel</h3>
        <p className="text-xs text-green-200 mt-0.5">
          Interrogate 100 consumer personas about buying behavior, pricing sensitivity, formulation tradeoffs, and channel strategy
        </p>
      </div>

      {messages.length === 0 && (
        <div className="px-6 py-4 border-b bg-gray-50">
          <p className="text-xs text-gray-500 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-800 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-[500px] overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-green-50 border border-green-200 text-green-900"
                    : "bg-gray-50 border border-gray-200 text-gray-800"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "#FFE200", color: "#00411E" }}>P</span>
                    Panel Response
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                  </div>
                  Consulting the panel...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about buying behavior, price sensitivity, formulation tradeoffs..."
            rows={2}
            className="flex-1 border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="self-end px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "#00411E", color: "#FFE200" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
