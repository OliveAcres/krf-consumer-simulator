"use client";

import { useState, useEffect } from "react";
import { SimulationResult } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const BAR_COLORS = { a: "#00411E", b: "#B45309" };

function Delta({ a, b, suffix = "", invert = false }: { a: number; b: number; suffix?: string; invert?: boolean }) {
  const diff = b - a;
  const better = invert ? diff < 0 : diff > 0;
  if (Math.abs(diff) < 0.05) return <span className="text-xs text-gray-400">--</span>;
  return (
    <span className={`text-xs font-semibold ${better ? "text-green-600" : "text-red-600"}`}>
      {diff > 0 ? "+" : ""}{diff.toFixed(1)}{suffix}
    </span>
  );
}

function MetricCard({ label, valueA, valueB, suffix = "/7" }: { label: string; valueA: number; valueB: number; suffix?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: BAR_COLORS.a }}>Bar A</p>
          <p className="text-xl font-bold text-gray-900">{valueA}{suffix}</p>
        </div>
        <div className="flex flex-col items-center">
          <Delta a={valueA} b={valueB} />
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs font-medium" style={{ color: BAR_COLORS.b }}>Bar B</p>
          <p className="text-xl font-bold text-gray-900">{valueB}{suffix}</p>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonDashboard({ resultA, resultB, labelA, labelB }: {
  resultA: SimulationResult;
  resultB: SimulationResult;
  labelA: string;
  labelB: string;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "channel" | "archetype" | "winners">("overview");
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const sA = resultA.summary;
  const sB = resultB.summary;

  // Radar data: A vs B across all dimensions
  const radarData = [
    { metric: "Purchase Intent", barA: sA.overallPurchaseIntent, barB: sB.overallPurchaseIntent },
    { metric: "Repeat Purchase", barA: sA.overallRepeatPurchase, barB: sB.overallRepeatPurchase },
    { metric: "Conversion %", barA: sA.projectedConversionRate / 100 * 7, barB: sB.projectedConversionRate / 100 * 7 },
    { metric: "Subscription %", barA: sA.projectedSubscriptionRate / 100 * 7, barB: sB.projectedSubscriptionRate / 100 * 7 },
    { metric: "Margin %", barA: sA.marginAnalysis.grossMargin / 100 * 7, barB: sB.marginAnalysis.grossMargin / 100 * 7 },
  ];

  // Channel comparison
  const channels = ["amazon", "d2c", "walmart"] as const;
  const channelLabels = { amazon: "Amazon", d2c: "D2C", walmart: "Walmart" };
  const channelCompare = channels.map((ch) => ({
    channel: channelLabels[ch],
    "Bar A: Purchase": sA.byChannel[ch].avgPurchaseIntent,
    "Bar B: Purchase": sB.byChannel[ch].avgPurchaseIntent,
    "Bar A: Repeat": sA.byChannel[ch].avgRepeatPurchase,
    "Bar B: Repeat": sB.byChannel[ch].avgRepeatPurchase,
  }));

  // Archetype comparison: find who flips preference
  const allArchetypes = Array.from(new Set([
    ...Object.keys(sA.byArchetype),
    ...Object.keys(sB.byArchetype),
  ])).sort();

  const archetypeCompare = allArchetypes.map((arch) => {
    const a = sA.byArchetype[arch];
    const b = sB.byArchetype[arch];
    return {
      archetype: arch,
      piA: a?.avgPurchaseIntent ?? 0,
      piB: b?.avgPurchaseIntent ?? 0,
      rpA: a?.avgRepeatPurchase ?? 0,
      rpB: b?.avgRepeatPurchase ?? 0,
      countA: a?.count ?? 0,
      countB: b?.count ?? 0,
      winner: (a?.avgPurchaseIntent ?? 0) > (b?.avgPurchaseIntent ?? 0) ? "A" :
              (b?.avgPurchaseIntent ?? 0) > (a?.avgPurchaseIntent ?? 0) ? "B" : "Tie",
      delta: (b?.avgPurchaseIntent ?? 0) - (a?.avgPurchaseIntent ?? 0),
    };
  });

  // Winner counts per persona
  const winsA = resultA.responses.filter((rA) => {
    const rB = resultB.responses.find((rb) => rb.personaId === rA.personaId);
    return rB && rA.purchaseIntent > rB.purchaseIntent;
  }).length;
  const winsB = resultB.responses.filter((rB) => {
    const rA = resultA.responses.find((ra) => ra.personaId === rB.personaId);
    return rA && rB.purchaseIntent > rA.purchaseIntent;
  }).length;
  const ties = 100 - winsA - winsB;

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">A/B Comparison Results</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: BAR_COLORS.a }} />
              <span className="font-medium">{labelA}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: BAR_COLORS.b }} />
              <span className="font-medium">{labelB}</span>
            </span>
          </div>
        </div>
        {/* Win/Loss/Tie bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: BAR_COLORS.a }}>{winsA} wins</span>
          <div className="flex-1 flex h-4 rounded-full overflow-hidden">
            <div style={{ width: `${winsA}%`, background: BAR_COLORS.a }} />
            <div style={{ width: `${ties}%`, background: "#d1d5db" }} />
            <div style={{ width: `${winsB}%`, background: BAR_COLORS.b }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: BAR_COLORS.b }}>{winsB} wins</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">{ties} ties out of 100 personas</p>
      </div>

      {/* Top-line metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Purchase Intent" valueA={sA.overallPurchaseIntent} valueB={sB.overallPurchaseIntent} />
        <MetricCard label="Conversion Rate" valueA={sA.projectedConversionRate} valueB={sB.projectedConversionRate} suffix="%" />
        <MetricCard label="Subscription Rate" valueA={sA.projectedSubscriptionRate} valueB={sB.projectedSubscriptionRate} suffix="%" />
        <MetricCard label="Gross Margin" valueA={sA.marginAnalysis.grossMargin} valueB={sB.marginAnalysis.grossMargin} suffix="%" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {(["overview", "channel", "archetype", "winners"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-white text-krf-forest shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "winners" ? "Head-to-Head" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Overall Comparison (Radar)</h3>
            {isClient && (
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis domain={[0, 7]} />
                <Radar name={labelA} dataKey="barA" stroke={BAR_COLORS.a} fill={BAR_COLORS.a} fillOpacity={0.2} />
                <Radar name={labelB} dataKey="barB" stroke={BAR_COLORS.b} fill={BAR_COLORS.b} fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Formulation Comparison</h3>
            <div className="space-y-2 text-sm">
              {([
                ["Description", resultA.formulation.description || "(none)", resultB.formulation.description || "(none)", true],
                ["Calories", `${resultA.formulation.calories} kcal`, `${resultB.formulation.calories} kcal`],
                ["Protein", `${resultA.formulation.proteinG}g`, `${resultB.formulation.proteinG}g`],
                ["Fat", `${resultA.formulation.fatG}g`, `${resultB.formulation.fatG}g`],
                ["Carbs", `${resultA.formulation.carbsG}g`, `${resultB.formulation.carbsG}g`],
                ["Fiber", `${resultA.formulation.fiberG}g`, `${resultB.formulation.fiberG}g`],
                ["Sugar", `${resultA.formulation.sugarG}g`, `${resultB.formulation.sugarG}g`],
                ["Total Weight", `${resultA.formulation.totalGrams}g`, `${resultB.formulation.totalGrams}g`],
                ["COGS", `$${resultA.formulation.cogsPerUnit.toFixed(2)}`, `$${resultB.formulation.cogsPerUnit.toFixed(2)}`],
                ["MSRP", `$${resultA.formulation.msrpPerBar.toFixed(2)}`, `$${resultB.formulation.msrpPerBar.toFixed(2)}`],
              ] as [string, string, string, boolean?][]).map(([label, valA, valB, isText]) => {
                const isDiff = valA !== valB;
                return (
                  <div key={label} className={`flex items-center py-1.5 px-2 rounded ${isDiff ? "bg-yellow-50" : ""}`}>
                    <span className="w-24 text-gray-500 text-xs">{label}</span>
                    <span className={`flex-1 ${isText ? "text-xs" : ""}`}>{valA}</span>
                    {isDiff ? <span className="text-xs text-yellow-600 mx-2">vs</span> : <span className="text-xs text-gray-300 mx-2">=</span>}
                    <span className={`flex-1 text-right ${isText ? "text-xs" : ""}`}>{valB}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Channel */}
      {activeTab === "channel" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Purchase Intent by Channel</h3>
            {isClient && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channelCompare}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis domain={[0, 7]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Bar A: Purchase" fill={BAR_COLORS.a} />
                <Bar dataKey="Bar B: Purchase" fill={BAR_COLORS.b} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channels.map((ch) => {
              const a = sA.byChannel[ch];
              const b = sB.byChannel[ch];
              const aWins = a.avgPurchaseIntent > b.avgPurchaseIntent;
              return (
                <div key={ch} className="bg-white rounded-xl p-5 shadow-sm border">
                  <h4 className="font-semibold text-sm mb-3">{channelLabels[ch]}</h4>
                  <div className="space-y-2 text-xs">
                    {([
                      ["Purchase Intent", a.avgPurchaseIntent, b.avgPurchaseIntent],
                      ["Repeat Purchase", a.avgRepeatPurchase, b.avgRepeatPurchase],
                      ["Nutrition Fit", a.avgNutritionFit, b.avgNutritionFit],
                      ["Price Acceptance", a.avgPriceAcceptance, b.avgPriceAcceptance],
                      ["Subscription %", a.subscriptionRate, b.subscriptionRate],
                    ] as [string, number, number][]).map(([label, vA, vB]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-gray-600">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold" style={{ color: BAR_COLORS.a }}>{vA}</span>
                          <Delta a={vA} b={vB} />
                          <span className="font-mono font-bold" style={{ color: BAR_COLORS.b }}>{vB}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t text-xs text-center font-medium" style={{ color: aWins ? BAR_COLORS.a : BAR_COLORS.b }}>
                    {aWins ? labelA : a.avgPurchaseIntent === b.avgPurchaseIntent ? "Tied" : labelB} wins this channel
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Archetype */}
      {activeTab === "archetype" && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Archetype Preference Map</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Archetype</th>
                  <th className="text-center p-3" style={{ color: BAR_COLORS.a }}>A: PI</th>
                  <th className="text-center p-3" style={{ color: BAR_COLORS.b }}>B: PI</th>
                  <th className="text-center p-3">Delta</th>
                  <th className="text-center p-3">Winner</th>
                </tr>
              </thead>
              <tbody>
                {archetypeCompare.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).map((row) => (
                  <tr key={row.archetype} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.archetype}</td>
                    <td className="p-3 text-center font-mono">{row.piA.toFixed(1)}</td>
                    <td className="p-3 text-center font-mono">{row.piB.toFixed(1)}</td>
                    <td className="p-3 text-center"><Delta a={row.piA} b={row.piB} /></td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        row.winner === "A" ? "bg-green-100 text-green-800" :
                        row.winner === "B" ? "bg-amber-100 text-amber-800" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {row.winner === "A" ? labelA : row.winner === "B" ? labelB : "Tie"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Head-to-Head */}
      {activeTab === "winners" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Per-Persona Winner (sorted by largest swing)</h3>
            <div className="max-h-[600px] overflow-y-auto space-y-2">
              {resultA.responses
                .map((rA) => {
                  const rB = resultB.responses.find((rb) => rb.personaId === rA.personaId);
                  if (!rB) return null;
                  const diff = rB.purchaseIntent - rA.purchaseIntent;
                  return { rA, rB, diff, absDiff: Math.abs(diff) };
                })
                .filter(Boolean)
                .sort((a, b) => b!.absDiff - a!.absDiff)
                .map((item) => {
                  const { rA, rB, diff } = item!;
                  const winner = diff > 0 ? "B" : diff < 0 ? "A" : "Tie";
                  return (
                    <div key={rA.personaId} className={`border rounded-lg p-3 text-sm ${
                      winner === "A" ? "border-l-4 border-l-green-700" :
                      winner === "B" ? "border-l-4 border-l-amber-600" : ""
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium">{rA.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{rA.archetype} / {rA.channel.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono font-bold" style={{ color: BAR_COLORS.a }}>{rA.purchaseIntent}/7</span>
                          <span className={`font-semibold ${diff > 0 ? "text-amber-600" : diff < 0 ? "text-green-700" : "text-gray-400"}`}>
                            {diff > 0 ? `B+${diff}` : diff < 0 ? `A+${Math.abs(diff)}` : "Tie"}
                          </span>
                          <span className="font-mono font-bold" style={{ color: BAR_COLORS.b }}>{rB.purchaseIntent}/7</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <p><span style={{ color: BAR_COLORS.a }}>A:</span> {rA.feedback}</p>
                        <p><span style={{ color: BAR_COLORS.b }}>B:</span> {rB.feedback}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
