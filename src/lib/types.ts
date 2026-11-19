import { z } from "zod";

/** Structured reply the coach must return. The UI renders it as cards. */
export const CoachReplySchema = z.object({
  risk: z
    .enum(["none", "caution", "crisis"])
    .describe(
      "none = everyday concern; caution = touches medical/legal (boundaries skill); crisis = emergency/abuse/self-harm (crisis-escalation skill)",
    ),
  language: z.enum(["en", "ur", "ur-Latn"]).describe("Language/script of the reply, matching the parent"),
  summary: z.string().describe("One empathetic sentence reflecting the concern"),
  steps: z
    .array(
      z.object({
        title: z.string().describe("2-5 word action-first title"),
        detail: z.string().describe("1-2 short sentences: what to do or say"),
      }),
    )
    .describe("2-4 steps (3 is ideal)"),
  checkIn: z.object({
    kind: z.enum(["question", "time"]),
    text: z.string().describe("Follow-up question, or when to come back"),
  }),
});

export type CoachReply = z.infer<typeof CoachReplySchema>;

export type ReplySource = "live" | "demo" | "safety-fallback";

export type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; reply: CoachReply; source: ReplySource }
  | { id: string; role: "error"; content: string };

/** Flattens a structured reply into text so it can be sent back as conversation history. */
export function replyToText(r: CoachReply): string {
  return [r.summary, ...r.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`), `Check-in: ${r.checkIn.text}`].join(
    "\n",
  );
}
