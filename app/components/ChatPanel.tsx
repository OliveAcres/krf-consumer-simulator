"use client";

import { useState, useRef, useEffect } from "react";
import { SimulationResult } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSimulationContext(result: SimulationResult) {
  const personaDetails = result.responses.map((r) =>
    `[${r.channel.toUpperCase()}] ${r.name} (${r.archetype}) | PI:${r.purchaseIntent} RP:${r.repeatPurchase} FA:${r.flavorAppeal} NF:${r.nutritionFit} PA:${r.priceAcceptance} Sub:${r.wouldSubscribe ? "Y" : "N"} | "${r.feedback}" | Improve: "${r.suggestedImprovement}"`
  );

  return {
    formulation: result.formulation,
    summary: result.summary,
    personaDetails,
  };
}

const RESULTS_PROMPTS = [
  "Which persona segments are most likely to churn after first purchase and why?",
  "What's the biggest formulation change that would improve purchase intent across all channels?",
  "Compare Amazon vs D2C vs Walmart reception. Where should we focus distribution?",
  "Which personas would subscribe, and what subscription price point maximizes retention?",
  "What are the top 3 dealbreakers killing conversion, and how do we fix them?",
];
const GENERAL_PROMPTS = [
  "What protein-to-calorie ratio maximizes appeal for performance athletes?",
  "How should we price a premium organic bar for the D2C channel?",
  "What are the biggest trends in the snack bar market right now?",
  "How do we formulate a bar that appeals to both keto dieters and casual wellness seekers?",
  "What sugar threshold triggers rejection from health-conscious parents?",
];

export default function ChatPanel({ result }: { result?: SimulationResult | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          simulationContext: result ? buildSimulationContext(result) : null,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([...updatedMessages, { role: "assistant", content: `Error: ${data.error}` }]);
      } else {
        setMessages([...updatedMessages, { role: "assistant", content: data.response }]);
      }
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };
  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #00411E 0%, #006B32 100%)" }}>
        <h2 className="text-lg font-bold text-white">{result ? "Ask the Consumer Panel" : "KRF R&D Assistant"}</h2>
        <p className="text-sm text-green-200 mt-1">
          {result
            ? "Interrogate persona data from this simulation. Ask about segments, pricing, improvements, or competitive positioning."
            : "Ask about formulation strategy, market trends, pricing, or competitive positioning. Run a simulation to unlock persona-level Q&A."}
        </p>
      </div>

      {/* Starter prompts (show when no messages) */}
      {messages.length === 0 && (
        <div className="p-6 border-b border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {(result ? RESULTS_PROMPTS : GENERAL_PROMPTS).map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-green-600 hover:bg-green-50 text-gray-700 hover:text-green-800 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Messages */}
      <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-green-800 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-200">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about segments, pricing, improvements, competitive positioning..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#00411E" }}
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
