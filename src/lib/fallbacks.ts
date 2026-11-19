import type { CoachReply } from "./types";

const hasUrduScript = (t: string) => /[؀-ۿ]/.test(t);

/** Fixed crisis reply: used when the safety check fires and no live model is available or it fails. */
export function crisisReply(text: string): CoachReply {
  return hasUrduScript(text)
    ? {
        risk: "crisis",
        language: "ur",
        summary: "آپ جو بتا رہے ہیں وہ سنجیدہ ہے، اور آپ کو اور آپ کے بچے کو ابھی مدد ملنی چاہیے۔",
        steps: [
          { title: "فوراً مدد لیں", detail: "اگر ابھی کسی کو خطرہ ہے تو اپنے علاقے کے ایمرجنسی نمبر پر کال کریں۔" },
          { title: "بچے کو محفوظ رکھیں", detail: "بچے کے ساتھ رہیں اور نقصان پہنچانے والی چیز یا شخص سے دور رکھیں۔" },
          { title: "کسی ماہر سے رابطہ", detail: "ڈاکٹر، بچوں کے تحفظ کے ادارے یا کسی بھروسے کے بڑے سے فوراً بات کریں۔" },
        ],
        checkIn: { kind: "question", text: "کیا آپ اور آپ کا بچہ اس وقت محفوظ ہیں؟" },
      }
    : {
        risk: "crisis",
        language: "en",
        summary: "What you're describing sounds serious, and you and your child deserve help right now.",
        steps: [
          { title: "Get immediate help", detail: "If anyone is in danger right now, call your local emergency number." },
          { title: "Make it safe", detail: "Stay with your child and keep them away from whatever or whoever is causing harm." },
          {
            title: "Reach a professional",
            detail: "Contact a doctor, your local child-protection service, or a crisis helpline as soon as you can.",
          },
        ],
        checkIn: { kind: "question", text: "Are you and your child safe right now?" },
      };
}

/**
 * Demo mode (no API key): pre-written sample replies so the deployed site is explorable.
 * Clearly labelled "Demo reply" in the UI. Live mode uses the real skill-driven agent.
 */
export function demoReply(text: string): CoachReply {
  const t = text.toLowerCase();
  if (hasUrduScript(text) || /\b(mera|meri|beta|beti|bacha|bachay|nahi|karta|karti)\b/.test(t)) {
    const roman = !hasUrduScript(text);
    return roman
      ? {
          risk: "none",
          language: "ur-Latn",
          summary: "Aap ki pareshani samajh aati hai, roz ki yeh kashmakash thaka deti hai.",
          steps: [
            { title: "Aik hi routine", detail: "Har din aik hi waqt aur aik hi tarteeb rakhein, taake bacha jaane ke kya hone wala hai." },
            { title: "Pehle jazbaat, phir hadd", detail: "Kahein: 'Main samajhta/samajhti hoon aap naraz ho, lekin qaida wohi rahega.'" },
            { title: "Choti tareef", detail: "Jab bacha thora sa bhi sahi kare, foran tareef karein." },
          ],
          checkIn: { kind: "time", text: "Teen din yeh aazmayein, phir batayein kya farq para?" },
        }
      : {
          risk: "none",
          language: "ur",
          summary: "یہ روز کی کشمکش آپ کو تھکا دیتی ہے، اور یہ بالکل سمجھ میں آتا ہے۔",
          steps: [
            { title: "ایک ہی معمول", detail: "ہر دن ایک ہی وقت اور ایک ہی ترتیب رکھیں تاکہ بچہ جانے آگے کیا ہوگا۔" },
            { title: "پہلے جذبات، پھر حد", detail: "کہیں: 'میں سمجھتی ہوں آپ ناراض ہیں، لیکن اصول وہی رہے گا۔'" },
            { title: "چھوٹی تعریف", detail: "جب بچہ تھوڑا سا بھی ٹھیک کرے، فوراً تعریف کریں۔" },
          ],
          checkIn: { kind: "time", text: "تین دن یہ آزمائیں، پھر بتائیں کیا فرق پڑا؟" },
        };
  }
  if (/\b(adhd|autis|diagnos|medicine|medication|dose|lawyer|custody|legal)\b/.test(t)) {
    return {
      risk: "caution",
      language: "en",
      summary: "It makes sense to wonder about this, and it deserves a proper look from a qualified professional.",
      steps: [
        { title: "Book the right expert", detail: "A paediatrician (or a family lawyer for legal questions) can assess this properly." },
        { title: "Note real examples", detail: "Write down what happens, when, and how often, and bring the list to the appointment." },
        { title: "Keep routines steady", detail: "Meanwhile, predictable days and calm one-on-one time help almost every child." },
      ],
      checkIn: { kind: "question", text: "Would you like help preparing questions for the appointment?" },
    };
  }
  if (/\b(sleep|bed|bedtime|night|wake)/.test(t)) {
    return {
      risk: "none",
      language: "en",
      summary: "Bedtime has turned into a nightly battle, and you're running on empty.",
      steps: [
        { title: "Same wind-down every night", detail: "Bath, pyjamas, one story, lights out, in the same order at the same time." },
        { title: "Screens off an hour before", detail: "Swap the tablet for a calm activity like drawing or a puzzle." },
        { title: "Boring, brief returns", detail: "If they get up, walk them back calmly with one line: 'It's sleep time.'" },
      ],
      checkIn: { kind: "time", text: "Try this for 3 nights, then tell me what changed." },
    };
  }
  return {
    risk: "none",
    language: "en",
    summary: "That sounds exhausting, and it's clear you want to handle it well.",
    steps: [
      { title: "Give a heads-up", detail: "Warn 5 minutes before changes: 'Two more minutes, then we stop.' A visible timer helps." },
      { title: "Name it, hold the limit", detail: "'You're upset it's over. It's still over.' Stay calm and close, and don't re-argue." },
      { title: "Have a next thing ready", detail: "Move straight to something they enjoy so the switch has something to look forward to." },
    ],
    checkIn: { kind: "question", text: "How old is your child, and when does this usually happen?" },
  };
}
