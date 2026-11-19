"use client";

import { createDeepAgent } from "deepagents/browser";
import { ChatAnthropic } from "@langchain/anthropic";
import { toolStrategy } from "langchain";
import { COACH_FILES } from "@/generated/coach-files";
import { CoachReplySchema, replyToText, type ChatMessage, type CoachReply } from "./types";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

/**
 * Runs the skill-driven deep agent entirely in the browser.
 * The coach persona (/AGENTS.md) and skills (/skills/<name>/SKILL.md) are loaded into
 * deepagents' in-memory StateBackend from the bundled markdown.
 */
function buildAgent(apiKey: string, model: string) {
  return createDeepAgent({
    name: "alpha-kids-parent-coach",
    model: new ChatAnthropic({
      model,
      apiKey,
      maxTokens: 1500,
      // BYO key: the key stays in this browser tab and goes only to api.anthropic.com.
      clientOptions: { dangerouslyAllowBrowser: true },
    }),
    memory: ["/AGENTS.md"],
    skills: ["/skills/"],
    permissions: [
      { operations: ["read"], paths: ["/**"] },
      { operations: ["write"], paths: ["/**"], mode: "deny" },
    ],
    // Tool-calling structured output: the final answer must match the reply schema.
    responseFormat: toolStrategy(CoachReplySchema),
  });
}

function seedFiles() {
  const now = new Date().toISOString();
  return Object.fromEntries(
    Object.entries(COACH_FILES).map(([p, content]) => [
      p,
      { content, mimeType: "text/markdown", created_at: now, modified_at: now },
    ]),
  );
}

let cached: { key: string; model: string; agent: ReturnType<typeof buildAgent> } | undefined;

export async function runCoach(
  history: ChatMessage[],
  opts: { apiKey: string; model?: string; crisisHint: string | null },
): Promise<CoachReply> {
  const model = opts.model || DEFAULT_MODEL;
  if (!cached || cached.key !== opts.apiKey || cached.model !== model) {
    cached = { key: opts.apiKey, model, agent: buildAgent(opts.apiKey, model) };
  }

  type Turn = { role: "user" | "assistant"; content: string };
  const messages = history.flatMap((m): Turn[] =>
    m.role === "user"
      ? [{ role: "user", content: m.content }]
      : m.role === "assistant"
        ? [{ role: "assistant", content: replyToText(m.reply) }]
        : [],
  );
  if (opts.crisisHint) {
    messages.push({
      role: "user",
      content: `[app safety note: the safety check flagged the last message as possible ${opts.crisisHint}. Use the crisis-escalation skill.]`,
    });
  }

  const result = await cached.agent.invoke({ messages, files: seedFiles() }, { recursionLimit: 25 });
  const parsed = CoachReplySchema.safeParse((result as { structuredResponse?: unknown }).structuredResponse);
  if (!parsed.success) throw new Error("The coach returned an unexpected reply format.");
  return parsed.data;
}
