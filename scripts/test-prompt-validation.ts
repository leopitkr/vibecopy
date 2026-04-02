/**
 * Prompt Validation Test Script
 *
 * Tests 5 real-world scenarios to evaluate prompt usability
 * Run: npx tsx scripts/test-prompt-validation.ts
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { buildGenerateCopyMessages } from "../lib/prompts/generateCopy";

// Manual .env.local loader
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0) {
      process.env[key] = rest.join("=");
    }
  }
}
loadEnv();

const OPENAI_MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 900;

interface ShortformScript {
  hook: string;
  body: string;
}

interface GenerateOutput {
  hook_headlines: string[];
  benefits: string[];
  dm_messages: string[];
  comment_triggers: string[];
  scarcity_lines: string[];
  shortform_scripts: ShortformScript[];
}

const TEST_CASES = [
  {
    id: 1,
    name: "Beauty - Collagen",
    input: `저분자 콜라겐 스틱입니다.
하루 1포로 간편하게 섭취 가능하고, 피부 탄력과 보습 개선에 도움을 줍니다.
비린 맛 없이 먹기 쉬운 복숭아 맛입니다.`,
  },
  {
    id: 2,
    name: "Diet / Health",
    input: `가르시니아 기반 다이어트 보조제입니다.
탄수화물이 지방으로 합성되는 것을 억제하는데 도움을 줄 수 있습니다.
하루 2번 섭취로 간편하게 관리 가능합니다.`,
  },
  {
    id: 3,
    name: "Lifestyle / Vacuum",
    input: `무선 핸디 청소기입니다.
가볍고 휴대성이 좋아 차량이나 원룸에서 사용하기 좋습니다.
강력한 흡입력과 USB 충전 방식입니다.`,
  },
  {
    id: 4,
    name: "Food / Protein Shake",
    input: `단백질 쉐이크입니다.
식사 대용으로 간편하게 섭취 가능하고, 단백질 함량이 높습니다.
초코맛으로 맛있게 먹을 수 있습니다.`,
  },
  {
    id: 5,
    name: "Bad Input - Stress Test",
    input: `좋은 제품입니다.
품질이 좋고 가격도 괜찮습니다.`,
  },
];

// Generic phrases to detect
const GENERIC_PHRASES = [
  "일상에 도움",
  "합리적인 선택",
  "만족스러운",
  "프리미엄",
  "고객 만족",
  "가성비 좋은",
  "실속 있는",
  "추천드려요",
  "좋은 제품",
  "특별한 경험",
  "다양한",
  "편리한",
  "유용한",
  "완벽한",
  "최고의",
  "고품질",
  "최상의",
];

function detectGenericPhrases(output: GenerateOutput): string[] {
  const allText = [
    ...output.hook_headlines,
    ...output.benefits,
    ...output.dm_messages,
    ...output.comment_triggers,
    ...output.scarcity_lines,
    ...output.shortform_scripts.map((s) => s.hook + " " + s.body),
  ].join(" ");

  return GENERIC_PHRASES.filter((phrase) => allText.includes(phrase));
}

function parseOutput(content: string): GenerateOutput | null {
  try {
    let cleanJson = content.trim();
    const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanJson = codeBlockMatch[1].trim();
    }
    return JSON.parse(cleanJson);
  } catch {
    return null;
  }
}

async function runTest(
  openai: OpenAI,
  testCase: (typeof TEST_CASES)[0]
): Promise<{ output: GenerateOutput | null; error?: string }> {
  const messages = buildGenerateCopyMessages(
    "text",
    testCase.input,
    "social",
    "review"
  );

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return { output: null, error: "Empty response from API" };
    }

    const parsed = parseOutput(content);
    if (!parsed) {
      return { output: null, error: "Failed to parse JSON" };
    }

    return { output: parsed };
  } catch (e) {
    return { output: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey, timeout: 30000 });

  console.log("=" .repeat(80));
  console.log("VIBECOPY PROMPT VALIDATION TEST");
  console.log("Config: channel=social, vibe=review");
  console.log("=" .repeat(80));
  console.log("");

  const results: Array<{
    testCase: (typeof TEST_CASES)[0];
    output: GenerateOutput | null;
    error?: string;
    evaluation: {
      usability: "A" | "B" | "C";
      specificity: "High" | "Medium" | "Low";
      feelsReal: boolean;
      genericPhrases: string[];
      issues: string[];
    } | null;
  }> = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`TEST CASE ${testCase.id}: ${testCase.name}`);
    console.log(`${"─".repeat(80)}`);
    console.log("\nInput:");
    console.log(testCase.input);
    console.log("\nGenerating...");

    const result = await runTest(openai, testCase);

    if (result.error || !result.output) {
      console.log(`\n❌ ERROR: ${result.error}`);
      results.push({
        testCase,
        output: null,
        error: result.error,
        evaluation: null,
      });
      continue;
    }

    const output = result.output;

    // Print full output
    console.log("\n📦 GENERATED OUTPUT:");
    console.log(JSON.stringify(output, null, 2));

    // Evaluate
    const genericPhrases = detectGenericPhrases(output);
    const issues: string[] = [];

    // Check specificity
    const allLines = [
      ...output.hook_headlines,
      ...output.benefits,
    ];

    let specificCount = 0;
    for (const line of allLines) {
      // Check for specific patterns: time references, situations, visible changes
      const hasTime = /[0-9]+일|일주일|하루|아침|저녁|밤|주|개월/.test(line);
      const hasSituation = /[때문에|하니까|해보니|써보니|먹고|쓰고|할 때|하면서]/.test(line);
      const hasChange = /[되다|됐|안|없|생기|줄어|늘어]/.test(line);
      if (hasTime || hasSituation || hasChange) {
        specificCount++;
      }
    }

    const specificityRatio = specificCount / allLines.length;
    let specificity: "High" | "Medium" | "Low";
    if (specificityRatio >= 0.7) specificity = "High";
    else if (specificityRatio >= 0.4) specificity = "Medium";
    else specificity = "Low";

    // Check if it feels real (1st person, casual tone)
    const firstPersonIndicators = ["제가", "저는", "나는", "내가", "써봤", "먹어봤", "해봤", "진짜", "솔직히"];
    const feelsRealLines = allLines.filter(line =>
      firstPersonIndicators.some(ind => line.includes(ind))
    );
    const feelsReal = feelsRealLines.length >= allLines.length * 0.3;

    // Determine usability
    let usability: "A" | "B" | "C";
    if (genericPhrases.length === 0 && specificity === "High" && feelsReal) {
      usability = "A";
    } else if (genericPhrases.length <= 2 && specificity !== "Low") {
      usability = "B";
    } else {
      usability = "C";
    }

    // Identify issues
    if (genericPhrases.length > 0) {
      issues.push(`Generic phrases found: ${genericPhrases.join(", ")}`);
    }
    if (specificity === "Low") {
      issues.push("Low specificity - lines lack concrete situations/changes");
    }
    if (!feelsReal) {
      issues.push("Doesn't feel like real 후기 - missing 1st person or casual tone");
    }
    if (output.hook_headlines.some(h => h.length > 50)) {
      issues.push("Some headlines are too long");
    }

    const evaluation = {
      usability,
      specificity,
      feelsReal,
      genericPhrases,
      issues,
    };

    // Print evaluation
    console.log("\n📊 EVALUATION:");
    console.log(`  - Usability: ${usability}`);
    console.log(`  - Specificity: ${specificity}`);
    console.log(`  - Feels real (후기 느낌): ${feelsReal ? "Yes" : "No"}`);
    console.log(`  - Generic phrases detected: ${genericPhrases.length > 0 ? "Yes" : "No"}`);
    if (genericPhrases.length > 0) {
      console.log(`    Found: ${genericPhrases.join(", ")}`);
    }
    if (issues.length > 0) {
      console.log("  - Key issues:");
      issues.forEach(issue => console.log(`    • ${issue}`));
    }

    results.push({ testCase, output, evaluation });
  }

  // Final Summary
  console.log("\n");
  console.log("=".repeat(80));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(80));

  const aCount = results.filter(r => r.evaluation?.usability === "A").length;
  const bCount = results.filter(r => r.evaluation?.usability === "B").length;
  const cCount = results.filter(r => r.evaluation?.usability === "C").length;
  const errorCount = results.filter(r => r.error).length;

  console.log(`\n  A count: ${aCount} / 5`);
  console.log(`  B count: ${bCount} / 5`);
  console.log(`  C count: ${cCount} / 5`);
  console.log(`  Errors: ${errorCount} / 5`);

  console.log("\n" + "─".repeat(80));
  console.log("DECISION:");

  if (aCount >= 3) {
    console.log("\n  ✅ READY FOR NEXT STEP");
    console.log("  Prompt is producing usable, specific copy.");
  } else {
    console.log("\n  ❌ NEEDS MORE PROMPT TUNING");
    console.log("\n  Top issues across all results:");

    const allIssues = results
      .flatMap(r => r.evaluation?.issues || [])
      .reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sortedIssues = Object.entries(allIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedIssues.forEach(([issue, count], i) => {
      console.log(`    ${i + 1}. ${issue} (${count} occurrences)`);
    });
  }

  console.log("\n" + "=".repeat(80));
}

main();
