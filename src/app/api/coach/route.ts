import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSafety } from "@/lib/safety";
import { runCoach, type CoachReply } from "@/lib/coach";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

/** Used when the safety check fires but the LLM is unavailable: never leave a crisis unanswered. */
function fallbackCrisisReply(text: string): CoachReply {
  const urdu = /[؀-ۿ]/.test(text);
  return urdu
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
          { title: "Reach a professional", detail: "Contact a doctor, your local child-protection service, or a crisis helpline as soon as you can." },
        ],
        checkIn: { kind: "question", text: "Are you and your child safe right now?" },
      };
}

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages } = parsed.data;
  const latest = messages[messages.length - 1];
  if (latest.role !== "user") {
    return NextResponse.json({ error: "Last message must be from the parent" }, { status: 400 });
  }

  // Layer 1: deterministic safety check, independent of the model.
  const safety = checkSafety(latest.content);

  try {
    // Layer 2: skill-driven deepagent (crisis-escalation skill handles subtler cases).
    const reply = await runCoach(messages, safety.crisis ? safety.categories.join(" / ") : null);
    // Layer 3: the code check can only raise risk, never lower it.
    const risk = safety.crisis ? "crisis" : reply.risk;
    return NextResponse.json({ reply: { ...reply, risk }, safety });
  } catch (err) {
    console.error("[coach] agent error:", err);
    if (safety.crisis) {
      return NextResponse.json({ reply: fallbackCrisisReply(latest.content), safety, degraded: true });
    }
    return NextResponse.json(
      { error: "The coach is unavailable right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
