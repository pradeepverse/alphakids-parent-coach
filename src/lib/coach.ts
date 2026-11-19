import "server-only";
import path from "node:path";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

/** Structured reply the agent must return. The UI renders this as cards. */
export const CoachReplySchema = z.object({
  risk: z
    .enum(["none", "caution", "crisis"])
    .describe("none = everyday concern; caution = touches medical/legal (boundaries skill); crisis = emergency/abuse/self-harm"),
  language: z.enum(["en", "ur", "ur-Latn"]).describe("Language/script of the reply, matching the parent"),
  summary: z.string().describe("One empathetic sentence reflecting the concern"),
  steps: z
    .array(
      z.object({
        title: z.string().describe("2-5 word action-first title"),
        detail: z.string().describe("1-2 short sentences: what to do or say"),
      }),
    )
    .min(1)
    .max(4),
  checkIn: z.object({
    kind: z.enum(["question", "time"]),
    text: z.string().describe("Follow-up question, or when to come back"),
  }),
});

export type CoachReply = z.infer<typeof CoachReplySchema>;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const COACH_DIR = path.join(process.cwd(), "coach");

function buildAgent() {
  return createDeepAgent({
    name: "alpha-kids-parent-coach",
    model: new ChatAnthropic({
      model: process.env.COACH_MODEL ?? "claude-sonnet-5-5",
      temperature: 0.3,
      maxTokens: 1500,
    }),
    // Coach persona + skills are plain markdown on disk, served read-only.
    backend: new FilesystemBackend({ rootDir: COACH_DIR, virtualMode: true }),
    memory: ["/AGENTS.md"],
    skills: ["/skills/"],
    permissions: [
      { operations: ["read"], paths: ["/**"] },
      { operations: ["write"], paths: ["/**"], mode: "deny" },
    ],
    responseFormat: CoachReplySchema,
  });
}

let agent: ReturnType<typeof buildAgent> | undefined;

export async function runCoach(history: ChatTurn[], crisisHint: string | null): Promise<CoachReply> {
  agent ??= buildAgent();

  const messages = history.map((m) => ({ role: m.role, content: m.content }));
  if (crisisHint) {
    // The deterministic pre-check fired: tell the agent explicitly.
    messages.push({
      role: "user",
      content: `[system safety note: the app's safety check flagged this message as a possible ${crisisHint}. Use the crisis-escalation skill.]`,
    });
  }

  const result = await agent.invoke({ messages }, { recursionLimit: 25 });
  const parsed = CoachReplySchema.safeParse((result as { structuredResponse?: unknown }).structuredResponse);
  if (!parsed.success) throw new Error("Coach returned an invalid reply");
  return parsed.data;
}
