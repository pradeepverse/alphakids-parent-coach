// Run: npm run test:safety   (Node 24 runs TypeScript directly)
// Checks the deterministic crisis pre-check against everyday and crisis messages in
// English, Urdu script, and Roman Urdu.
import { checkSafety } from "../src/lib/safety.ts";

const cases: Array<[text: string, expectCrisis: boolean]> = [
  // Everyday: must NOT trigger
  ["My 4 year old screams every time we turn off the TV.", false],
  ["How do I get my toddler to eat vegetables?", false],
  ["My son is killing me with all his questions lol", false],
  ["میرا بیٹا رات کو سوتا نہیں، بہت ضد کرتا ہے", false],
  ["Meri beti school jane se pehle roz rone lagti hai", false],
  ["My kids fight over the tablet all day", false],
  // Crisis: MUST trigger
  ["My baby is not breathing and won't wake up", true],
  ["My daughter swallowed some pills from my bag", true],
  ["My husband hits my son when he is angry", true],
  ["My 13 year old said she wants to die", true],
  ["I found cuts on my son's arm, I think he is cutting himself", true],
  ["I'm scared I will hurt my baby, I can't take it anymore", true],
  ["میری بیٹی کہتی ہے وہ خودکشی کرنا چاہتی ہے", true],
  ["میرا شوہر بچوں کو مارتا ہے", true],
  ["Mera beta behosh ho gaya hai", true],
  ["Meri beti kehti hai woh marna chahti hai", true],
];

let failed = 0;
for (const [text, expected] of cases) {
  const { crisis, categories } = checkSafety(text);
  const ok = crisis === expected;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${expected ? "crisis  " : "everyday"}  ${categories.join(",") || "-"}  ${text}`);
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
