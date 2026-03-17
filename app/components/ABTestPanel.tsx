"use client";

import { useState, useCallback } from "react";
import { Formulation, SimulationResult } from "@/lib/types";
import ComparisonDashboard from "./ComparisonDashboard";

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
  msrpPerBar: 3.49,
  barCount: 12,
};

const VARIABLE_OPTIONS: { key: keyof Formulation; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "calories", label: "Calories", min: 80, max: 450, step: 10, unit: " kcal" },
  { key: "proteinG", label: "Protein", min: 0, max: 35, step: 1, unit: "g" },
  { key: "fatG", label: "Fat", min: 0, max: 25, step: 1, unit: "g" },
  { key: "carbsG", label: "Carbs", min: 0, max: 50, step: 1, unit: "g" },
  { key: "fiberG", label: "Fiber", min: 0, max: 20, step: 1, unit: "g" },
  { key: "sugarG", label: "Sugar", min: 0, max: 25, step: 1, unit: "g" },
  { key: "totalGrams", label: "Total Weight", min: 20, max: 100, step: 1, unit: "g" },
  { key: "cogsPerUnit", label: "COGS per Unit", min: 0.10, max: 3.00, step: 0.05, unit: "" },  { key: "msrpPerBar", label: "MSRP per Bar", min: 0.50, max: 8.00, step: 0.01, unit: "" },
  { key: "barCount", label: "Bar Count", min: 1, max: 48, step: 1, unit: " bars" },
];

function MiniSlider({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs text-gray-600">{label}</label>
        <span className="text-xs font-mono font-bold text-krf-forest">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  );
}

function FormulationColumn({ title, color, formulation, onUpdate }: {
  title: string; color: string; formulation: Formulation;
  onUpdate: (field: keyof Formulation, value: number | string) => void;
}) {
  return (
    <div className="border-2 rounded-xl p-4" style={{ borderColor: color }}>
      <h3 className="text-sm font-bold mb-3" style={{ color }}>{title}</h3>
      <textarea
        value={formulation.description}
        onChange={(e) => onUpdate("description", e.target.value)}        placeholder="Description / concept..."
        rows={2}
        className="w-full border rounded-lg p-2 text-xs resize-none mb-3 focus:outline-none focus:ring-1"
        style={{ "--tw-ring-color": color } as React.CSSProperties}
      />
      <MiniSlider label="Calories" value={formulation.calories} onChange={(v) => onUpdate("calories", v)} min={80} max={450} step={10} unit=" kcal" />
      <MiniSlider label="Protein" value={formulation.proteinG} onChange={(v) => onUpdate("proteinG", v)} min={0} max={35} step={1} unit="g" />
      <MiniSlider label="Fat" value={formulation.fatG} onChange={(v) => onUpdate("fatG", v)} min={0} max={25} step={1} unit="g" />
      <MiniSlider label="Carbs" value={formulation.carbsG} onChange={(v) => onUpdate("carbsG", v)} min={0} max={50} step={1} unit="g" />
      <MiniSlider label="Fiber" value={formulation.fiberG} onChange={(v) => onUpdate("fiberG", v)} min={0} max={20} step={1} unit="g" />
      <MiniSlider label="Sugar" value={formulation.sugarG} onChange={(v) => onUpdate("sugarG", v)} min={0} max={25} step={1} unit="g" />
      <hr className="my-2" />
      <MiniSlider label="Total Weight" value={formulation.totalGrams} onChange={(v) => onUpdate("totalGrams", v)} min={20} max={100} step={1} unit="g" />
      <MiniSlider label="COGS" value={formulation.cogsPerUnit} onChange={(v) => onUpdate("cogsPerUnit", v)} min={0.10} max={3.00} step={0.05} unit="" />
      <MiniSlider label="MSRP" value={formulation.msrpPerBar} onChange={(v) => onUpdate("msrpPerBar", v)} min={0.50} max={8.00} step={0.01} unit="" />
      <MiniSlider label="Bar Count" value={formulation.barCount} onChange={(v) => onUpdate("barCount", v)} min={1} max={48} step={1} unit=" bars" />
    </div>
  );
}

export default function ABTestPanel() {
  const [subMode, setSubMode] = useState<"two-bars" | "one-variable">("two-bars");
  const [personaCount, setPersonaCount] = useState(100);
  const [formA, setFormA] = useState<Formulation>({ ...DEFAULT_FORMULATION });
  const [formB, setFormB] = useState<Formulation>({ ...DEFAULT_FORMULATION });
  const [selectedVar, setSelectedVar] = useState<keyof Formulation>("proteinG");
  const [varValueA, setVarValueA] = useState<number>(10);
  const [varValueB, setVarValueB] = useState<number>(20);
  const [baseForm, setBaseForm] = useState<Formulation>({ ...DEFAULT_FORMULATION });
  const [resultA, setResultA] = useState<SimulationResult | null>(null);
  const [resultB, setResultB] = useState<SimulationResult | null>(null);  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const updateA = useCallback((field: keyof Formulation, value: number | string) => {
    setFormA((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateB = useCallback((field: keyof Formulation, value: number | string) => {
    setFormB((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateBase = useCallback((field: keyof Formulation, value: number | string) => {
    setBaseForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const copyAToB = () => setFormB({ ...formA });

  const selectedVarOption = VARIABLE_OPTIONS.find((v) => v.key === selectedVar)!;

  const runComparison = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setResultA(null);
    setResultB(null);

    let fA: Formulation;
    let fB: Formulation;
    if (subMode === "one-variable") {
      fA = { ...baseForm, [selectedVar]: varValueA };
      fB = { ...baseForm, [selectedVar]: varValueB };
    } else {
      fA = formA;
      fB = formB;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 90));
    }, 1500);

    try {
      // Run both simulations in parallel
      const [resA, resB] = await Promise.all([
        fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fA, personaCount }),
        }),
        fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fB, personaCount }),
        }),
      ]);

      clearInterval(progressInterval);

      if (!resA.ok) {        const d = await resA.json();
        throw new Error(`Bar A failed: ${d.error || resA.status}`);
      }
      if (!resB.ok) {
        const d = await resB.json();
        throw new Error(`Bar B failed: ${d.error || resB.status}`);
      }

      const dataA: SimulationResult = await resA.json();
      const dataB: SimulationResult = await resB.json();

      setProgress(100);
      setTimeout(() => {
        setResultA(dataA);
        setResultB(dataB);
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Labels for results
  const labelA = subMode === "one-variable"
    ? `${selectedVarOption.label}: ${varValueA}${selectedVarOption.unit}`
    : "Bar A";
  const labelB = subMode === "one-variable"
    ? `${selectedVarOption.label}: ${varValueB}${selectedVarOption.unit}`
    : "Bar B";
  return (
    <div>
      {/* Sub-mode selector */}
      <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSubMode("two-bars")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            subMode === "two-bars" ? "bg-white text-krf-forest shadow-sm" : "text-gray-500"
          }`}
        >
          Two Bars (Full Comparison)
        </button>
        <button
          onClick={() => setSubMode("one-variable")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            subMode === "one-variable" ? "bg-white text-krf-forest shadow-sm" : "text-gray-500"
          }`}
        >
          One Variable (Isolate Impact)
        </button>
      </div>

      {/* Input section */}
      {subMode === "two-bars" ? (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={copyAToB} className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600">
              Copy A to B
            </button>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormulationColumn title="Bar A" color="#00411E" formulation={formA} onUpdate={updateA} />
            <FormulationColumn title="Bar B" color="#B45309" formulation={formB} onUpdate={updateB} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Base Formulation</h3>
          <textarea
            value={baseForm.description}
            onChange={(e) => updateBase("description", e.target.value)}
            placeholder="Description / concept..."
            rows={2}
            className="w-full border rounded-lg p-2 text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-krf-forest/20"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {VARIABLE_OPTIONS.filter((v) => v.key !== selectedVar).map((v) => (
              <MiniSlider key={v.key} label={v.label} value={baseForm[v.key] as number}
                onChange={(val) => updateBase(v.key, val)} min={v.min} max={v.max} step={v.step} unit={v.unit} />
            ))}
          </div>

          <hr className="my-4" />

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Variable to Test</h3>
          <select
            value={selectedVar}
            onChange={(e) => {
              const key = e.target.value as keyof Formulation;
              setSelectedVar(key);              const opt = VARIABLE_OPTIONS.find((v) => v.key === key)!;
              setVarValueA(opt.min + (opt.max - opt.min) * 0.3);
              setVarValueB(opt.min + (opt.max - opt.min) * 0.7);
            }}
            className="text-sm border rounded-md px-3 py-2 mb-4 w-full"
          >
            {VARIABLE_OPTIONS.map((v) => (
              <option key={v.key} value={v.key}>{v.label}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-6">
            <div className="border-2 rounded-lg p-4" style={{ borderColor: "#00411E" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#00411E" }}>Value A</p>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-600">{selectedVarOption.label}</span>
                <span className="text-sm font-mono font-bold text-krf-forest">{varValueA}{selectedVarOption.unit}</span>
              </div>
              <input type="range" min={selectedVarOption.min} max={selectedVarOption.max}
                step={selectedVarOption.step} value={varValueA}
                onChange={(e) => setVarValueA(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="border-2 rounded-lg p-4" style={{ borderColor: "#B45309" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#B45309" }}>Value B</p>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-600">{selectedVarOption.label}</span>
                <span className="text-sm font-mono font-bold" style={{ color: "#B45309" }}>{varValueB}{selectedVarOption.unit}</span>
              </div>
              <input type="range" min={selectedVarOption.min} max={selectedVarOption.max}
                step={selectedVarOption.step} value={varValueB}                onChange={(e) => setVarValueB(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Persona count slider */}
      <div className="mb-4 bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex justify-between items-baseline mb-1">
          <label className="text-sm font-medium text-gray-700">Personas per Bar</label>
          <span className="text-sm font-mono font-bold text-krf-forest">{personaCount}</span>
        </div>
        <input type="range" min={10} max={100} step={10} value={personaCount}
          onChange={(e) => setPersonaCount(parseInt(e.target.value))} className="w-full" />
        <p className="text-xs text-gray-400 mt-1">{personaCount * 2} total simulations ({personaCount} per bar)</p>
      </div>

      {/* Run button */}
      <button
        onClick={runComparison}
        disabled={loading}
        className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        style={{ background: loading ? "#ccc" : "#00411E", color: loading ? "#666" : "#FFE200" }}
      >
        {loading ? `Running A/B Comparison (${personaCount * 2} personas)...` : `Run A/B Comparison (${personaCount} per bar)`}
      </button>

      {/* Progress */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">          <div className="flex gap-2 mb-4">
            <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          </div>
          <p className="text-lg font-medium text-krf-forest mb-2">Running {personaCount * 2} Consumer Simulations</p>
          <p className="text-sm text-gray-500 mb-4">Bar A and Bar B evaluated in parallel across all personas...</p>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--krf-forest)" }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{progress}% complete</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-6">{error}</div>
      )}

      {/* Results */}
      {!loading && resultA && resultB && (
        <ComparisonDashboard resultA={resultA} resultB={resultB} labelA={labelA} labelB={labelB} />
      )}
    </div>
  );
}
