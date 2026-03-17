// 100 consumer personas weighted by channel revenue: 50 Amazon, 30 D2C, 20 Walmart
// Each channel has a distinct persona mix reflecting actual buying behavior

export interface Persona {
  id: number;
  name: string;
  channel: "amazon" | "d2c" | "walmart";
  archetype: string;
  age: number;
  gender: string;
  income: string;
  priorities: string[];
  dealbreakers: string[];
  pricesensitivity: "low" | "medium" | "high";
  description: string;
}

const ARCHETYPES = {
  amazon: [
    { archetype: "Performance Athlete", count: 8, desc: "Serious gym-goer, optimizes macros, buys bulk via Subscribe & Save. Demands 15-25g protein, scrutinizes amino acid profiles. Whey isolate preferred. Low price sensitivity for proven functional benefits. Will abandon brand immediately for undisclosed formulation changes." },
    { archetype: "Busy Professional", count: 12, desc: "Uses bars as meal replacement during back-to-back meetings. Wants balanced macros with 15-30g protein + 3-5g fiber for sustained energy. Buys variety packs. Willing to pay $3.50-5.00 for premium functional ingredients. High discovery via ambient shopping and social media." },
    { archetype: "Comparison Shopper", count: 10, desc: "Reads every review, compares nutrition labels across 5+ brands before purchasing. Influenced heavily by star ratings and review volume. 28% will abandon go-to brand for better-reviewed competitor. Moderate price sensitivity." },
    { archetype: "Health-Conscious Parent", count: 8, desc: "Buys multi-packs for family. Prioritizes low sugar, allergen-free, soft/chewy texture kids will eat. Extremely price-per-unit sensitive. Seeks mini/half-size formats. Reviews mentioning kids average 4.92 stars vs 4.72 for other sizes." },
    { archetype: "Keto/Low-Carb Dieter", count: 5, desc: "Strict net carb counting, demands clean-label keto formulations with zero sugar alcohols that spike insulin. Scrutinizes digital ingredient lists obsessively. Will pay premium for verified macros." },
    { archetype: "Casual Wellness Seeker", count: 4, desc: "Protein bar as healthier alternative to candy. Light-moderate activity. Wants approachable flavor, clean label. 44% of global consumers prefer high-protein, low-sugar alternatives over conventional snacks." },
    { archetype: "Budget Bulk Buyer", count: 3, desc: "Maximizes units per dollar. Buys largest multi-packs available. Gen X heads of household seeking club-style value. Will sacrifice premium ingredients for volume." },
  ],
  d2c: [
    { archetype: "Brand Loyalist", count: 7, desc: "Subscribed to KRF or similar D2C brand. Values the relationship, mission alignment, and consistent quality. High CLV, low churn when formulation stays consistent. Engages with brand content and shares on social." },
    { archetype: "Values-Driven Flexitarian", count: 6, desc: "Chooses plant-based options for environmental sustainability. Deep pre-purchase research on sourcing and certifications. Demands organic, fair-trade, zero artificial additives. Repeat rate 18-22% lower than whey buyers due to texture sensitivity. 30% reject bars with unpleasant texture regardless of ethics." },
    { archetype: "Outdoor Adventurer", count: 5, desc: "Core KRF demographic. Needs portable, real-food energy for hiking, biking, camping. Values organic ingredients, brand authenticity, and environmental mission. Preserve Where You Play resonates deeply." },
    { archetype: "Functional Wellness Enthusiast", count: 4, desc: "Seeks adaptogens, probiotics, collagen, or other functional additions. Treats bars as dietary supplements. Willing to pay $4-5+ per bar. Drives the premium segment's 11.78% CAGR." },
    { archetype: "Subscription Optimizer", count: 4, desc: "Manages multiple D2C subscriptions. Expects flexible swap/pause options. Churn trigger is flavor fatigue or inflexible subscription management. Retention requires continuous flavor rotation." },
    { archetype: "Clean Label Purist", count: 2, desc: "Zero tolerance for artificial anything. Demands pronounceable ingredients, minimal processing. 60%+ of new bar launches now feature clean-label positioning driven by this segment." },
    { archetype: "GLP-1 Medication User", count: 2, desc: "On weight loss medication, needs high-protein dense snacking to maintain muscle mass during rapid weight reduction. Extremely focused on protein density per calorie." },
  ],
  walmart: [
    { archetype: "Value Family Shopper", count: 6, desc: "Price is the primary filter. Needs to feed a household affordably. Buys the largest pack at lowest per-unit cost. 45% of consumers perceive $1.50-3.00 bars as too expensive for daily use." },
    { archetype: "Mainstream Health Seeker", count: 4, desc: "Wants healthier snacking but won't pay premium prices. Entry-level protein bar buyer. Influenced by front-of-pack claims more than detailed nutrition data. Mass market bars capture 67% market share." },
    { archetype: "Grab-and-Go Parent", count: 4, desc: "Buys for kids' lunchboxes and after-school snacks. Needs kid-approved flavors at Walmart pricing. Allergen awareness high due to school policies. Soft, chewy texture required." },
    { archetype: "Weekend Warrior", count: 3, desc: "Moderately active, uses bars around casual exercise. Not obsessive about macros but wants decent protein content. Price-conscious but will pay slightly more for recognizable quality brands." },
    { archetype: "Senior Health Manager", count: 2, desc: "Managing chronic conditions, views food as medicine. Needs clear nutritional info, moderate protein, controlled sugar. Fiber content important for digestive health. Highly loyal once trust is established." },
    { archetype: "College Student", count: 1, desc: "Extreme budget constraints. Bars are cheap meal replacements between classes. Flavor and price dominate, nutrition is secondary. Smallest pack sizes due to limited storage." },
  ],
};

function generateName(seed: number, gender: string): string {
  const maleNames = ["James", "Michael", "Robert", "David", "William", "John", "Richard", "Thomas", "Daniel", "Matthew", "Chris", "Andrew", "Joshua", "Ryan", "Brandon", "Justin", "Kevin", "Brian", "Mark", "Steven", "Tyler", "Nathan", "Aaron", "Carlos", "Diego", "Raj", "Wei", "Kenji", "Marcus", "Andre"];
  const femaleNames = ["Jennifer", "Sarah", "Jessica", "Emily", "Ashley", "Amanda", "Rachel", "Stephanie", "Lauren", "Nicole", "Megan", "Samantha", "Elizabeth", "Hannah", "Olivia", "Sophia", "Emma", "Isabella", "Maria", "Lisa", "Karen", "Michelle", "Susan", "Priya", "Mei", "Yuki", "Aisha", "Nina", "Rosa", "Dana"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Patel", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers"];
  const first = gender === "F" ? femaleNames[seed % femaleNames.length] : maleNames[seed % maleNames.length];
  const last = lastNames[(seed * 7 + 3) % lastNames.length];
  return `${first} ${last}`;
}

function generateAge(archetype: string, seed: number): number {
  const ranges: Record<string, [number, number]> = {
    "Performance Athlete": [22, 42],
    "Busy Professional": [28, 52],
    "Comparison Shopper": [25, 55],
    "Health-Conscious Parent": [30, 48],
    "Keto/Low-Carb Dieter": [28, 55],
    "Casual Wellness Seeker": [22, 45],
    "Budget Bulk Buyer": [35, 58],
    "Brand Loyalist": [26, 50],
    "Values-Driven Flexitarian": [22, 42],
    "Outdoor Adventurer": [24, 48],
    "Functional Wellness Enthusiast": [30, 55],
    "Subscription Optimizer": [25, 45],
    "Clean Label Purist": [28, 50],
    "GLP-1 Medication User": [32, 58],
    "Value Family Shopper": [28, 52],
    "Mainstream Health Seeker": [25, 50],
    "Grab-and-Go Parent": [28, 45],
    "Weekend Warrior": [25, 50],
    "Senior Health Manager": [55, 72],
    "College Student": [18, 24],
  };
  const [min, max] = ranges[archetype] || [25, 50];
  return min + (seed % (max - min + 1));
}

function generateIncome(archetype: string, channel: string): string {
  const incomeMap: Record<string, string> = {
    "Performance Athlete": "$65K-120K",
    "Busy Professional": "$85K-180K",
    "Comparison Shopper": "$55K-100K",
    "Health-Conscious Parent": "$75K-140K",
    "Keto/Low-Carb Dieter": "$70K-130K",
    "Casual Wellness Seeker": "$45K-85K",
    "Budget Bulk Buyer": "$50K-80K",
    "Brand Loyalist": "$70K-130K",
    "Values-Driven Flexitarian": "$60K-110K",
    "Outdoor Adventurer": "$55K-100K",
    "Functional Wellness Enthusiast": "$90K-160K",
    "Subscription Optimizer": "$65K-120K",
    "Clean Label Purist": "$75K-140K",
    "GLP-1 Medication User": "$80K-150K",
    "Value Family Shopper": "$40K-70K",
    "Mainstream Health Seeker": "$40K-75K",
    "Grab-and-Go Parent": "$45K-80K",
    "Weekend Warrior": "$50K-90K",
    "Senior Health Manager": "$45K-85K",
    "College Student": "$15K-30K",
  };
  return incomeMap[archetype] || "$50K-90K";
}

function getPriorities(archetype: string): string[] {
  const map: Record<string, string[]> = {
    "Performance Athlete": ["protein content 20g+", "complete amino acid profile", "low sugar", "whey isolate source", "bulk pricing"],
    "Busy Professional": ["sustained energy", "balanced macros", "convenient format", "variety of flavors", "premium functional ingredients"],
    "Comparison Shopper": ["best value per gram of protein", "high review scores", "transparent nutrition label", "competitive pricing"],
    "Health-Conscious Parent": ["low sugar", "allergen-free options", "kid-friendly texture", "mini/half-size format", "price per unit"],
    "Keto/Low-Carb Dieter": ["net carbs under 5g", "zero sugar alcohols", "high fat content", "clean label keto", "no hidden sugars"],
    "Casual Wellness Seeker": ["tastes like a treat", "clean ingredients", "moderate protein", "recognizable brand", "approachable flavors"],
    "Budget Bulk Buyer": ["lowest price per bar", "largest pack available", "acceptable nutrition", "shelf stability"],
    "Brand Loyalist": ["consistent formulation", "brand mission alignment", "subscription convenience", "community engagement", "real food ingredients"],
    "Values-Driven Flexitarian": ["plant-based protein", "organic certification", "fair trade sourcing", "zero artificial additives", "environmental impact"],
    "Outdoor Adventurer": ["portable energy", "real food ingredients", "organic", "brand authenticity", "environmental mission"],
    "Functional Wellness Enthusiast": ["adaptogens or probiotics", "collagen or functional adds", "premium quality", "science-backed claims"],
    "Subscription Optimizer": ["flexible subscription", "flavor rotation options", "discount for recurring", "easy pause/cancel"],
    "Clean Label Purist": ["minimal ingredients", "pronounceable everything", "no processing aids", "organic certification"],
    "GLP-1 Medication User": ["maximum protein per calorie", "muscle preservation", "dense nutrition", "small serving size"],
    "Value Family Shopper": ["lowest cost", "family-size packs", "kids will eat it", "basic nutrition"],
    "Mainstream Health Seeker": ["healthier than candy", "recognizable brand", "front-of-pack claims", "affordable"],
    "Grab-and-Go Parent": ["lunchbox-friendly", "nut-free option", "soft chewy texture", "kid-approved flavor"],
    "Weekend Warrior": ["decent protein", "good taste", "reasonable price", "convenient"],
    "Senior Health Manager": ["controlled sugar", "fiber content", "clear labeling", "moderate protein", "digestive health"],
    "College Student": ["cheapest option", "filling", "good flavor", "small pack size"],
  };
  return map[archetype] || ["taste", "nutrition", "price"];
}

function getDealbreakers(archetype: string): string[] {
  const map: Record<string, string[]> = {
    "Performance Athlete": ["protein under 15g", "excessive sugar", "artificial sweeteners", "undisclosed formulation changes"],
    "Busy Professional": ["chalky texture", "too sweet", "melts easily", "limited flavors"],
    "Comparison Shopper": ["poor reviews", "inflated nutrition claims", "overpriced vs competitors"],
    "Health-Conscious Parent": ["high sugar", "contains common allergens", "hard/crunchy texture", "large bar size for kids"],
    "Keto/Low-Carb Dieter": ["net carbs over 5g", "maltitol or sugar alcohols", "hidden sugars", "high calorie"],
    "Casual Wellness Seeker": ["bad taste", "too many ingredients", "chalky texture"],
    "Budget Bulk Buyer": ["price over $2/bar", "small pack only", "premium positioning"],
    "Brand Loyalist": ["sudden formulation change", "loss of organic certification", "mission drift"],
    "Values-Driven Flexitarian": ["any animal protein", "artificial anything", "non-organic", "unethical sourcing"],
    "Outdoor Adventurer": ["artificial ingredients", "excessive packaging", "misleading natural claims"],
    "Functional Wellness Enthusiast": ["no functional differentiation", "generic formulation", "unsubstantiated claims"],
    "Subscription Optimizer": ["inflexible subscription", "no flavor swaps", "hard to cancel"],
    "Clean Label Purist": ["any artificial ingredient", "long ingredient list", "processed proteins"],
    "GLP-1 Medication User": ["low protein density", "high calorie", "excessive carbs"],
    "Value Family Shopper": ["price over $1.50/bar", "kids reject flavor", "unfamiliar brand"],
    "Mainstream Health Seeker": ["bad taste", "confusing label", "too expensive"],
    "Grab-and-Go Parent": ["contains nuts", "hard texture", "too large for kids", "high sugar"],
    "Weekend Warrior": ["bad taste", "overpriced", "too small"],
    "Senior Health Manager": ["high sugar", "unclear labeling", "hard to chew", "artificial sweeteners"],
    "College Student": ["over $2/bar", "bad flavor", "too healthy-tasting"],
  };
  return map[archetype] || ["bad taste", "overpriced"];
}

function getPriceSensitivity(archetype: string): "low" | "medium" | "high" {
  const map: Record<string, "low" | "medium" | "high"> = {
    "Performance Athlete": "low",
    "Busy Professional": "low",
    "Comparison Shopper": "medium",
    "Health-Conscious Parent": "high",
    "Keto/Low-Carb Dieter": "medium",
    "Casual Wellness Seeker": "medium",
    "Budget Bulk Buyer": "high",
    "Brand Loyalist": "low",
    "Values-Driven Flexitarian": "medium",
    "Outdoor Adventurer": "medium",
    "Functional Wellness Enthusiast": "low",
    "Subscription Optimizer": "medium",
    "Clean Label Purist": "low",
    "GLP-1 Medication User": "low",
    "Value Family Shopper": "high",
    "Mainstream Health Seeker": "high",
    "Grab-and-Go Parent": "high",
    "Weekend Warrior": "medium",
    "Senior Health Manager": "medium",
    "College Student": "high",
  };
  return map[archetype] || "medium";
}

export function generatePersonas(): Persona[] {
  const personas: Persona[] = [];
  let id = 1;

  for (const [channel, archetypes] of Object.entries(ARCHETYPES)) {
    for (const { archetype, count, desc } of archetypes) {
      for (let i = 0; i < count; i++) {
        const seed = id * 13 + i * 7;
        const gender = seed % 3 === 0 ? "F" : seed % 3 === 1 ? "M" : (seed % 2 === 0 ? "F" : "M");
        personas.push({
          id,
          name: generateName(seed, gender),
          channel: channel as Persona["channel"],
          archetype,
          age: generateAge(archetype, seed),
          gender,
          income: generateIncome(archetype, channel),
          priorities: getPriorities(archetype),
          dealbreakers: getDealbreakers(archetype),
          pricesensitivity: getPriceSensitivity(archetype),
          description: desc,
        });
        id++;
      }
    }
  }

  return personas;
}

export function getPersonaSummary(personas: Persona[]) {
  const byChannel = {
    amazon: personas.filter((p) => p.channel === "amazon"),
    d2c: personas.filter((p) => p.channel === "d2c"),
    walmart: personas.filter((p) => p.channel === "walmart"),
  };

  const byArchetype: Record<string, number> = {};
  personas.forEach((p) => {
    byArchetype[p.archetype] = (byArchetype[p.archetype] || 0) + 1;
  });

  return { byChannel, byArchetype, total: personas.length };
}
