export interface Formulation {
  description: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  sugarG: number;
  cogsPerUnit: number;
  totalGrams: number;
  msrpPerBar: number;
  barCount: number;
}

export interface PersonaResponse {
  personaId: number;
  name: string;
  channel: "amazon" | "d2c" | "walmart";
  archetype: string;
  purchaseIntent: number; // 1-10
  repeatPurchase: number; // 1-10
  flavorAppeal: number; // 1-10
  nutritionFit: number; // 1-10
  priceAcceptance: number; // 1-10
  feedback: string;
  wouldSubscribe: boolean;
  suggestedImprovement: string;
}
export interface SimulationResult {
  formulation: Formulation;
  responses: PersonaResponse[];
  summary: SimulationSummary;
  timestamp: string;
}

export interface SimulationSummary {
  overallPurchaseIntent: number;
  overallRepeatPurchase: number;
  byChannel: {
    amazon: ChannelSummary;
    d2c: ChannelSummary;
    walmart: ChannelSummary;
  };
  byArchetype: Record<string, ArchetypeSummary>;
  topConcerns: string[];
  topStrengths: string[];
  projectedConversionRate: number;
  projectedSubscriptionRate: number;
  estimatedRetailPrice: number;
  marginAnalysis: {
    suggestedRetail: number;
    grossMargin: number;
    viable: boolean;
  };
}
export interface ChannelSummary {
  avgPurchaseIntent: number;
  avgRepeatPurchase: number;
  avgNutritionFit: number;
  avgPriceAcceptance: number;
  subscriptionRate: number;
  count: number;
}

export interface ArchetypeSummary {
  avgPurchaseIntent: number;
  avgRepeatPurchase: number;
  count: number;
  keyFeedback: string;
}
