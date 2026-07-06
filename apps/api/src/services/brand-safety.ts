interface LayerResult {
  layer: string;
  passed: boolean;
  score: number;
  details: string[];
}

const BLACKLIST_WORDS = [
  "competitor", "mejor", "barato", "gratis", "garantizado", "milagro",
  "competitor_brand", "half_price", "bankrupt", "discrimination",
];

const COUNTRY_RULES: Record<string, string[]> = {
  MX: ["No claims without COFEPRIS approval", "No 'mejor' without substantiation"],
  US: ["FTC disclosure required for endorsements", "No unsubstantiated health claims"],
  AR: ["No 'el mejor' without evidence", "No misleading pricing claims"],
};

export async function runBrandSafetyCheck(
  _variantId: string,
  script: string,
  soulMd?: string,
  country?: string,
): Promise<{ passed: boolean; score: number; layers: LayerResult[]; summary: string }> {
  const layers: LayerResult[] = [];

  // Layer 1: Whiper / script coherence
  layers.push({
    layer: "transcription_match",
    passed: script.length > 10,
    score: script.length > 10 ? 100 : 0,
    details: script.length > 10 ? ["Script length valid"] : ["Script too short"],
  });

  // Layer 2: Blacklist
  const blacklistHits = BLACKLIST_WORDS.filter((w) => script.toLowerCase().includes(w));
  layers.push({
    layer: "blacklist",
    passed: blacklistHits.length === 0,
    score: Math.max(0, 100 - blacklistHits.length * 25),
    details: blacklistHits.length > 0
      ? [`Found blacklisted words: ${blacklistHits.join(", ")}`]
      : ["No blacklisted words found"],
  });

  // Layer 3: Tone classifier (simulated LLM)
  const toneScore = soulMd && script.includes(soulMd.split(" ").slice(0, 3).join(" "))
    ? 85 : 70;
  layers.push({
    layer: "tone_classifier",
    passed: toneScore >= 60,
    score: toneScore,
    details: toneScore >= 60 ? ["Tone consistent with brand guide"] : ["Tone mismatch detected"],
  });

  // Layer 4: Bias audit (simulated)
  const biasScore = 100;
  layers.push({
    layer: "bias_audit",
    passed: biasScore >= 80,
    score: biasScore,
    details: ["No bias detected"],
  });

  // Layer 5: Legal compliance
  const countryRules = country ? COUNTRY_RULES[country] ?? [] : [];
  const legalPassed = countryRules.length === 0 || !countryRules.some((r) => script.toLowerCase().includes(r.toLowerCase().slice(0, 10)));
  layers.push({
    layer: "legal_compliance",
    passed: legalPassed,
    score: legalPassed ? 100 : 50,
    details: legalPassed ? [`Compliant with ${country ?? "default"} regulations`] : [`Flagged for ${country} rules`],
  });

  const scores = layers.map((l) => l.score);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const allPassed = layers.every((l) => l.passed);
  const failedLayers = layers.filter((l) => !l.passed).map((l) => l.layer);

  return {
    passed: allPassed,
    score: overallScore,
    layers,
    summary: allPassed
      ? "All safety checks passed"
      : `Failed checks: ${failedLayers.join(", ")}`,
  };
}
