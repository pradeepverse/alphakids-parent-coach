/**
 * Deterministic crisis pre-check. Runs BEFORE the LLM agent.
 *
 * Why: skills are only followed if the model chooses to load them. For emergencies,
 * abuse and self-harm we want a guarantee, so a match here forces the escalation card
 * in the UI regardless of what the model returns. It deliberately over-triggers
 * (a false alarm costs a few seconds; a miss can cost a life).
 *
 * Covers English, Urdu script, and Roman Urdu.
 */

export type CrisisCategory = "emergency" | "abuse" | "self_harm";

export interface SafetyCheck {
  crisis: boolean;
  categories: CrisisCategory[];
}

const PATTERNS: Record<CrisisCategory, RegExp[]> = {
  emergency: [
    /\b(not|isn'?t|stopped)\s+breathing\b/i,
    /\bcan'?t\s+breathe\b/i,
    /\bunconscious\b|\bunresponsive\b|\bwon'?t\s+wake\s+up\b/i,
    /\bseizure|convuls|fitting\b/i,
    /\bchok(e|ed|ing)\b/i,
    /\b(swallowed|drank|ate)\b.{0,30}\b(pills?|bleach|poison|battery|batteries|medicine|chemical)/i,
    /\bpoison(ed|ing)?\b|\boverdose\b/i,
    /\b(bleeding|blood)\b.{0,30}\b(a lot|heavily|won'?t stop|everywhere)\b/i,
    /\b(child|son|daughter|kid|baby)\b.{0,30}\b(missing|is lost|kidnapped)\b|\bkidnap/i,
    /\bemergency\b/i,
    // Urdu script
    /سانس\s*نہیں|بے\s*ہوش|دورہ\s*پڑ|زہر|اغوا|گم\s*ہو\s*گیا|خون\s*بہ/,
    // Roman Urdu
    /\bsaans\s+nahi\b|\bbehosh\b|\bzehar\b|\baghwa\b|\bgum\s+ho\s+gaya\b/i,
  ],
  abuse: [
    /\babus(e|ed|ing|ive)\b/i,
    /\bmolest|\bgroom(ed|ing)\b|\btouch(es|ed|ing)?\s+(her|him|them)\s+(inappropriately|private)/i,
    /\bsexual(ly)?\b/i,
    /\b(hits?|hitting|beats?|beating|burn(s|ed|ing)?|chok(es|ing))\s+(my|the|our)\s+(child|son|daughter|kid|baby|wife|husband)\b/i,
    /\b(he|she|they)\s+(hits?|beats?|burns?)\s+(me|us|him|her)\b/i,
    /\b(i'?m|i am)\s+(afraid|scared)\s+(i('ll| will)|of)\s+(hurt|hit|harm)/i,
    /\b(i|i'?ll|i will|might)\s+(hurt|harm|shake|kill)\s+(my|the)\s+(baby|child|son|daughter|kid)\b/i,
    /\bdomestic\s+violence\b|\bunsafe\s+at\s+home\b/i,
    // Urdu script
    /مارتا|مارتی|پیٹتا|زیادتی|جنسی|غلط\s*طریقے\s*سے\s*چھو|تشدد/,
    // Roman Urdu
    /\b(maarta|marta|peet[ta]a|maarti)\s+hai\b|\bzyadti\b|\bjinsi\b|\btashadud\b/i,
  ],
  self_harm: [
    /\bsuicid/i,
    /\bkill\s+(my|him|her|them)sel(f|ves)\b/i,
    /\b(want|wants|wanted)\s+to\s+die\b/i,
    /\bend\s+(my|his|her|their)\s+life\b/i,
    /\bself[-\s]?harm|\bcutting\s+(her|him|them|my)sel|\bcuts?\s+(her|him|them|my)self\b/i,
    /\bbetter\s+off\s+(dead|without\s+me)\b/i,
    /\bno\s+reason\s+to\s+live\b/i,
    // Urdu script
    /خودکشی|خود\s*کشی|مرنا\s*چاہت|جان\s*دے\s*د|اپنے\s*آپ\s*کو\s*(نقصان|کاٹ)/,
    // Roman Urdu
    /\bkhud\s*kushi\b|\bmarna\s+chaht[aie]\b|\bjaan\s+de\s+d/i,
  ],
};

export function checkSafety(text: string): SafetyCheck {
  const categories = (Object.keys(PATTERNS) as CrisisCategory[]).filter((cat) =>
    PATTERNS[cat].some((re) => re.test(text)),
  );
  return { crisis: categories.length > 0, categories };
}
