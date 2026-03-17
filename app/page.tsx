"use client";

import { useState, useCallback } from "react";
import { Formulation, SimulationResult, PersonaResponse } from "@/lib/types";
import ChatPanel from "./components/ChatPanel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from "recharts";

const CHANNEL_COLORS = { amazon: "#FF9900", d2c: "#00411E", walmart: "#0071CE" };
const SCORE_COLORS = ["#dc2626", "#dc2626", "#f87171", "#fbbf24", "#fde68a", "#86efac", "#22c55e", "#15803d"];

function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score);
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold score-${Math.min(7, Math.max(1, rounded))}`}>
      {typeof score === "number" ? score.toFixed(1) : score}
    </span>
  );
}

function Slider({ label, value, onChange, min, max, step, unit, help }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; help?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-mono font-bold text-krf-forest">{value}{unit}</span>
      </div>
      {help && <p className="text-xs text-gray-400 mb-1">{help}</p>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function LoadingState({ batchProgress }: { batchProgress: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6">
        <div className="flex gap-2">
          <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
        </div>
      </div>
      <p className="text-lg font-medium text-krf-forest mb-2">Simulating 100 Consumer Responses</p>
      <p className="text-sm text-gray-500 mb-4">Claude is evaluating your formulation across all personas...</p>
      <div className="w-64 bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${batchProgress}%`, background: "var(--krf-forest)" }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{batchProgress}% complete</p>
    </div>
  );
}

function ResultsDashboard({ result }: { result: SimulationResult }) {
  const [activeTab, setActiveTab] = useState<"overview" | "channel" | "archetype" | "individual">("overview");
  const { summary, responses } = result;

  const channelData = [
    { channel: "Amazon", ...summary.byChannel.amazon, fill: CHANNEL_COLORS.amazon },
    { channel: "D2C", ...summary.byChannel.d2c, fill: CHANNEL_COLORS.d2c },
    { channel: "Walmart", ...summary.byChannel.walmart, fill: CHANNEL_COLORS.walmart },
  ];

  const radarData = [
    { metric: "Purchase Intent", amazon: summary.byChannel.amazon.avgPurchaseIntent, d2c: summary.byChannel.d2c.avgPurchaseIntent, walmart: summary.byChannel.walmart.avgPurchaseIntent },
    { metric: "Repeat Purchase", amazon: summary.byChannel.amazon.avgRepeatPurchase, d2c: summary.byChannel.d2c.avgRepeatPurchase, walmart: summary.byChannel.walmart.avgRepeatPurchase },
    { metric: "Nutrition Fit", amazon: summary.byChannel.amazon.avgNutritionFit, d2c: summary.byChannel.d2c.avgNutritionFit, walmart: summary.byChannel.walmart.avgNutritionFit },
    { metric: "Price Accept.", amazon: summary.byChannel.amazon.avgPriceAcceptance, d2c: summary.byChannel.d2c.avgPriceAcceptance, walmart: summary.byChannel.walmart.avgPriceAcceptance },
  ];

  const archetypeData = Object.entries(summary.byArchetype)
    .sort((a, b) => b[1].avgPurchaseIntent - a[1].avgPurchaseIntent)
    .map(([name, data]) => ({ name: name.length > 20 ? name.substring(0, 18) + "..." : name, fullName: name, ...data }));

  const subscriptionPieData = [
    { name: "Would Subscribe", value: summary.projectedSubscriptionRate, color: "#00411E" },
    { name: "One-time Only", value: 100 - summary.projectedSubscriptionRate, color: "#ddd" },
  ];

  const intentDistribution = [1, 2, 3, 4, 5, 6, 7].map((score) => ({
    score: score.toString(),
    count: responses.filter((r) => Math.round(r.purchaseIntent) === score).length,
    fill: SCORE_COLORS[score],
  }));

  return (
    <div>
      {/* Top-line metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Purchase Intent</p>
          <div className="flex items-center gap-2 mt-1">
            <ScoreBadge score={summary.overallPurchaseIntent} />
            <span className="text-2xl font-bold text-gray-900">{summary.overallPurchaseIntent}/7</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Conversion Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.projectedConversionRate}%</p>
          <p className="text-xs text-gray-400">Personas scoring 4+</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Subscription Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.projectedSubscriptionRate}%</p>
          <p className="text-xs text-gray-400">Would auto-replenish</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Margin Analysis</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.marginAnalysis.grossMargin}%</p>
          <p className={`text-xs ${summary.marginAnalysis.viable ? "text-green-600" : "text-red-600"}`}>
            {summary.marginAnalysis.viable ? "Viable" : "Below 50% threshold"} @ ${summary.marginAnalysis.suggestedRetail} retail
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {(["overview", "channel", "archetype", "individual"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-white text-krf-forest shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Channel Comparison (Radar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis domain={[0, 7]} />
                <Radar name="Amazon" dataKey="amazon" stroke={CHANNEL_COLORS.amazon} fill={CHANNEL_COLORS.amazon} fillOpacity={0.15} />
                <Radar name="D2C" dataKey="d2c" stroke={CHANNEL_COLORS.d2c} fill={CHANNEL_COLORS.d2c} fillOpacity={0.15} />
                <Radar name="Walmart" dataKey="walmart" stroke={CHANNEL_COLORS.walmart} fill={CHANNEL_COLORS.walmart} fillOpacity={0.15} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Purchase Intent Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={intentDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="score" label={{ value: "Score", position: "bottom", offset: -5 }} />
                <YAxis label={{ value: "# Personas", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="count" name="Personas">
                  {intentDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Subscription Propensity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={subscriptionPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {subscriptionPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Channel Subscription Rates</h3>
            <div className="space-y-4 mt-2">
              {channelData.map((ch) => (
                <div key={ch.channel}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: ch.fill }}>{ch.channel} ({ch.count} personas)</span>
                    <span className="font-bold">{ch.subscriptionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full transition-all" style={{ width: `${ch.subscriptionRate}%`, background: ch.fill }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Channel Tab */}
      {activeTab === "channel" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Channel Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 7]} />
                <YAxis dataKey="channel" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgPurchaseIntent" name="Purchase Intent" fill="#00411E" />
                <Bar dataKey="avgRepeatPurchase" name="Repeat Purchase" fill="#FFE200" />
                <Bar dataKey="avgNutritionFit" name="Nutrition Fit" fill="#006B32" />
                <Bar dataKey="avgPriceAcceptance" name="Price Accept." fill="#FF9900" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channelData.map((ch) => (
              <div key={ch.channel} className="bg-white rounded-xl p-5 shadow-sm border-l-4" style={{ borderColor: ch.fill }}>
                <h4 className="font-semibold text-lg mb-3" style={{ color: ch.fill }}>{ch.channel}</h4>
                <p className="text-xs text-gray-500 mb-3">{ch.count} personas (revenue-weighted)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Purchase Intent</span><ScoreBadge score={ch.avgPurchaseIntent} /></div>
                  <div className="flex justify-between"><span>Repeat Purchase</span><ScoreBadge score={ch.avgRepeatPurchase} /></div>
                  <div className="flex justify-between"><span>Nutrition Fit</span><ScoreBadge score={ch.avgNutritionFit} /></div>
                  <div className="flex justify-between"><span>Price Acceptance</span><ScoreBadge score={ch.avgPriceAcceptance} /></div>
                  <div className="flex justify-between pt-2 border-t"><span className="font-medium">Subscription Rate</span><span className="font-bold">{ch.subscriptionRate}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archetype Tab */}
      {activeTab === "archetype" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Purchase Intent by Persona Archetype</h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={archetypeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 7]} />
                <YAxis dataKey="name" type="category" width={160} className="text-xs" />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
                      <p className="font-bold">{d.fullName} ({d.count})</p>
                      <p>Purchase: {d.avgPurchaseIntent}/7</p>
                      <p>Repeat: {d.avgRepeatPurchase}/7</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">{d.keyFeedback}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="avgPurchaseIntent" name="Purchase Intent" fill="#00411E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Archetype Detail Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Archetype</th>
                    <th className="text-center p-3">Count</th>
                    <th className="text-center p-3">Purchase</th>
                    <th className="text-center p-3">Repeat</th>
                    <th className="text-left p-3">Key Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {archetypeData.map((row) => (
                    <tr key={row.fullName} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{row.fullName}</td>
                      <td className="p-3 text-center">{row.count}</td>
                      <td className="p-3 text-center"><ScoreBadge score={row.avgPurchaseIntent} /></td>
                      <td className="p-3 text-center"><ScoreBadge score={row.avgRepeatPurchase} /></td>
                      <td className="p-3 text-xs text-gray-600 max-w-md">{row.keyFeedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Individual Tab */}
      {activeTab === "individual" && <IndividualResponses responses={responses} />}
    </div>
  );
}

function IndividualResponses({ responses }: { responses: PersonaResponse[] }) {
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"purchaseIntent" | "name" | "archetype">("purchaseIntent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = responses.filter((r) => channelFilter === "all" || r.channel === channelFilter);
  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    if (sortBy === "name") return mult * a.name.localeCompare(b.name);
    if (sortBy === "archetype") return mult * a.archetype.localeCompare(b.archetype);
    return mult * (a.purchaseIntent - b.purchaseIntent);
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
          className="text-sm border rounded-md px-3 py-1.5">
          <option value="all">All Channels</option>
          <option value="amazon">Amazon (50)</option>
          <option value="d2c">D2C (30)</option>
          <option value="walmart">Walmart (20)</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm border rounded-md px-3 py-1.5">
          <option value="purchaseIntent">Sort: Purchase Intent</option>
          <option value="name">Sort: Name</option>
          <option value="archetype">Sort: Archetype</option>
        </select>
        <button onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
          className="text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50">
          {sortDir === "desc" ? "\u2193 Desc" : "\u2191 Asc"}
        </button>
        <span className="text-sm text-gray-400 ml-auto">{sorted.length} personas</span>
      </div>
      <div className="max-h-[600px] overflow-y-auto space-y-3">
        {sorted.map((r) => (
          <div key={r.personaId} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-sm">{r.name}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{
                  background: r.channel === "amazon" ? "#FFF3CD" : r.channel === "d2c" ? "#D1FAE5" : "#DBEAFE",
                  color: r.channel === "amazon" ? "#856404" : r.channel === "d2c" ? "#065F46" : "#1E40AF",
                }}>{r.channel.toUpperCase()}</span>
                <span className="ml-1 text-xs text-gray-400">{r.archetype}</span>
              </div>
              <ScoreBadge score={r.purchaseIntent} />
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mb-2">
              <span>Repeat: {r.repeatPurchase}/7</span>
              <span>Flavor: {r.flavorAppeal}/7</span>
              <span>Nutrition: {r.nutritionFit}/7</span>
              <span>Price: {r.priceAcceptance}/7</span>
              <span>{r.wouldSubscribe ? "\u2713 Would subscribe" : "\u00d7 One-time"}</span>
            </div>
            <p className="text-sm text-gray-700">{r.feedback}</p>
            {r.suggestedImprovement && r.suggestedImprovement !== "N/A" && (
              <p className="text-xs text-gray-500 mt-1 italic">Suggestion: {r.suggestedImprovement}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Default formulation based on typical KRF energy bar
const DEFAULT_FORMULATION: Formulation = {
  description: "",
  calories: 230,
  proteinG: 10,
  fatG: 9,
  carbsG: 30,
  fiberG: 3,
  sugarG: 14,
  cogsPerUnit: 1.20,
  totalGrams: 58,
};

export default function Home() {
  const [formulation, setFormulation] = useState<Formulation>(DEFAULT_FORMULATION);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((field: keyof Formulation, value: number | string) => {
    setFormulation((prev) => ({ ...prev, [field]: value }));
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setBatchProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setBatchProgress((prev) => Math.min(prev + 2, 90));
    }, 1000);

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulation),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: SimulationResult = await res.json();
      setBatchProgress(100);
      setTimeout(() => setResult(data), 300);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const macroGrams = formulation.proteinG + formulation.fatG + formulation.carbsG;
  const macroCalc = formulation.proteinG * 4 + formulation.fatG * 9 + formulation.carbsG * 4;
  const calorieDelta = Math.abs(formulation.calories - macroCalc);
  const macroWarning = macroGrams > formulation.totalGrams;
  const calorieWarning = calorieDelta > 30;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "#FFE200", color: "#00411E" }}>
            KRF
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consumer Simulator</h1>
            <p className="text-sm text-gray-500">R&D Formulation Testing / 100 AI Personas / Revenue-Weighted Channels</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-400 mt-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: CHANNEL_COLORS.amazon }} /> Amazon (50%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: CHANNEL_COLORS.d2c }} /> D2C (30%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: CHANNEL_COLORS.walmart }} /> Walmart (20%)</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border sticky top-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Formulation Input</h2>
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 block mb-1">Description / Concept</label>
              <textarea
                value={formulation.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="e.g., 'Organic dark chocolate peanut butter protein bar with oat base and honey' or 'high-protein keto bar under 200 calories'"
                rows={3}
                className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-krf-forest/20 focus:border-krf-forest"
              />
              <p className="text-xs text-gray-400 mt-1">Be as specific or vague as you want. Claude adapts.</p>
            </div>
            <hr className="mb-4" />
            <Slider label="Calories" value={formulation.calories} onChange={(v) => update("calories", v)} min={80} max={450} step={10} unit=" kcal" />
            <Slider label="Protein" value={formulation.proteinG} onChange={(v) => update("proteinG", v)} min={0} max={35} step={1} unit="g" />
            <Slider label="Fat" value={formulation.fatG} onChange={(v) => update("fatG", v)} min={0} max={25} step={1} unit="g" />
            <Slider label="Carbs" value={formulation.carbsG} onChange={(v) => update("carbsG", v)} min={0} max={50} step={1} unit="g" />
            <Slider label="Fiber" value={formulation.fiberG} onChange={(v) => update("fiberG", v)} min={0} max={15} step={1} unit="g" />
            <Slider label="Sugar" value={formulation.sugarG} onChange={(v) => update("sugarG", v)} min={0} max={25} step={1} unit="g" help="Must be \u2264 Carbs" />
            <hr className="my-4" />
            <Slider label="Total Weight" value={formulation.totalGrams} onChange={(v) => update("totalGrams", v)} min={20} max={100} step={1} unit="g" />
            <Slider label="COGS per Unit" value={formulation.cogsPerUnit} onChange={(v) => update("cogsPerUnit", v)} min={0.30} max={3.00} step={0.05} unit="" help={`Implied retail: ~$${(formulation.cogsPerUnit * 2.8).toFixed(2)}`} />
            {macroWarning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mt-3">
                Macro grams ({macroGrams}g) exceed total weight ({formulation.totalGrams}g). Adjust sliders.
              </div>
            )}
            {calorieWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700 mt-3">
                Calorie slider ({formulation.calories}) differs from macro math ({macroCalc} kcal) by {calorieDelta} kcal. This may affect simulation accuracy.
              </div>
            )}
            <button
              onClick={runSimulation}
              disabled={loading || macroWarning}
              className="w-full mt-6 py-3 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading ? "#ccc" : "#00411E", color: loading ? "#666" : "#FFE200" }}
            >
              {loading ? "Running Simulation..." : "Run 100-Persona Simulation"}
            </button>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mt-3">
                {error}
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          {loading && <LoadingState batchProgress={batchProgress} />}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#FFE200" }}>
                <span className="text-2xl">\ud83e\uddea</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Simulate</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Configure your formulation on the left, then hit the button. Claude will evaluate it from the perspective
                of 100 consumer personas weighted across Amazon (50), D2C (30), and Walmart (20) channels.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-xs text-gray-400">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="font-medium text-gray-600">20 Archetypes</p>
                  <p>Athletes, Parents, Flexitarians, GLP-1 users, and more</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="font-medium text-gray-600">5 Dimensions</p>
                  <p>Purchase intent, repeat, flavor, nutrition fit, price</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="font-medium text-gray-600">Margin Analysis</p>
                  <p>COGS to retail viability at 2.8x markup</p>
                </div>
              </div>
            </div>
          )}
          {!loading && result && <ResultsDashboard result={result} />}
          {!loading && result && <ChatPanel result={result} />}
        </div>
      </div>
    </main>
  );
}
