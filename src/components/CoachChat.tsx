"use client";

import { useEffect, useRef, useState } from "react";
import { checkSafety } from "@/lib/safety";
import { crisisReply, demoReply } from "@/lib/fallbacks";
import type { ChatMessage, CoachReply, ReplySource } from "@/lib/types";
import { downloadReminder, loadChat, pendingFromReply, saveChat, type PendingCheckIn } from "@/lib/checkins";
import { ReplyCard } from "./ReplyCard";

const KEY_STORAGE = "ak-coach-anthropic-key";
const MODEL_STORAGE = "ak-coach-model";

const EXAMPLES = [
  "My 4 year old screams every time we turn off the TV.",
  "میرا بیٹا رات کو سوتا نہیں، بہت ضد کرتا ہے",
  "Meri beti school jane se pehle roz rone lagti hai",
];

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * API key storage. Default: sessionStorage (this tab only). If the parent opts in to
 * "Remember key on this device", localStorage, so a check-in reminder that opens a
 * new tab can continue in live mode.
 */
function readStore(k: string) {
  try {
    return sessionStorage.getItem(k) ?? localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
}
function writeStore(k: string, v: string, remember = false) {
  try {
    for (const store of [sessionStorage, localStorage]) store.removeItem(k);
    if (v) (remember ? localStorage : sessionStorage).setItem(k, v);
  } catch {
    /* storage unavailable: value just won't persist across reloads */
  }
}
function isRemembered(k: string) {
  try {
    return localStorage.getItem(k) !== null;
  } catch {
    return false;
  }
}

export function CoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  const [pending, setPending] = useState<PendingCheckIn[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from browser storage after mount */
    setApiKey(readStore(KEY_STORAGE));
    setModel(readStore(MODEL_STORAGE));
    setRememberKey(isRemembered(KEY_STORAGE));

    // Restore the saved conversation, then resume any check-in that is due
    // (or that the parent opened from a calendar reminder link: ?checkin=<replyId>).
    const saved = loadChat();
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("checkin");
    const now = Date.now();
    const due = saved.pending.filter((p) => p.replyId === linked || p.dueAt <= now);
    const resumed: ChatMessage[] = due.map((p) => ({
      id: uid(),
      role: "checkin",
      text: p.question,
      language: p.language,
      forReplyId: p.replyId,
    }));
    setMessages([...saved.messages, ...resumed]);
    setPending(saved.pending.filter((p) => !due.includes(p)));
    setHydrated(true);
    if (linked) window.history.replaceState(null, "", window.location.pathname);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (hydrated) saveChat({ messages: messages.filter((m) => m.role !== "error"), pending });
  }, [messages, pending, hydrated]);

  useEffect(() => {
    // New coach reply: scroll to its top so the parent reads the summary first.
    // Otherwise (parent message / loading): keep the latest content in view.
    const last = messages[messages.length - 1];
    if (!busy && last && last.role !== "user") {
      document.getElementById(`msg-${last.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, busy]);

  const live = apiKey.trim().length > 0;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setBusy(true);

    // Layer 1: deterministic safety check, runs before (and independently of) the model.
    const safety = checkSafety(content);
    let reply: CoachReply;
    let source: ReplySource;

    try {
      if (live) {
        // Lazy-load the agent so demo mode stays lightweight.
        const { runCoach } = await import("@/lib/coach");
        const r = await runCoach(history, {
          apiKey: apiKey.trim(),
          model: model.trim() || undefined,
          crisisHint: safety.crisis ? safety.categories.join(" / ").replace(/_/g, "-") : null,
        });
        // Layer 3: the code check can only raise the risk level, never lower it.
        reply = safety.crisis ? { ...r, risk: "crisis" } : r;
        source = "live";
      } else {
        await new Promise((res) => setTimeout(res, 700));
        reply = safety.crisis ? crisisReply(content) : demoReply(content);
        source = "demo";
      }
      const replyId = uid();
      setMessages((m) => [...m, { id: replyId, role: "assistant", reply, source }]);
      const p = pendingFromReply(replyId, reply);
      if (p) setPending((list) => [...list, p]);
    } catch (err) {
      console.error("[coach]", err);
      if (safety.crisis) {
        // Never leave a crisis unanswered, even if the model call fails.
        setMessages((m) => [...m, { id: uid(), role: "assistant", reply: crisisReply(content), source: "safety-fallback" }]);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "error",
            content: /401|authentication|api[_ -]?key/i.test(msg)
              ? "That API key was rejected. Check it in Settings, or clear it to use demo mode."
              : "The coach couldn't reply just now. Please try again.",
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-brand sm:text-lg">
            Alpha Kids <span className="hidden sm:inline">Parent </span>Coach
          </h1>
          <p className="hidden text-xs text-muted sm:block">Short, practical plans · English or اردو</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-2">
          <span
            data-testid="mode-badge"
            title={live ? "Live replies from the AI coach" : "Sample replies. Add an API key in Settings for live replies"}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              live ? "bg-brand-soft text-brand" : "bg-caution-soft text-caution"
            }`}
          >
            {live ? "Live" : "Demo"}
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setPending([]);
                setRemindedIds([]);
              }}
              disabled={busy}
              aria-label="New chat"
              className="min-h-9 min-w-9 rounded-lg border border-line px-2 text-xs hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 sm:px-3"
            >
              <span aria-hidden className="sm:hidden">＋</span>
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="min-h-9 min-w-9 rounded-lg border border-line px-2 text-xs hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand sm:px-3"
            aria-expanded={showSettings}
            aria-label="Settings"
          >
            <span aria-hidden className="sm:hidden">⚙</span>
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {showSettings && (
        <section className="space-y-2 border-b border-line bg-surface px-4 py-3 text-sm" aria-label="Settings">
          <label className="block">
            <span className="text-xs font-semibold text-muted">Anthropic API key (optional, for live replies)</span>
            <input
              type="password"
              name="api-key"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                writeStore(KEY_STORAGE, e.target.value.trim(), rememberKey);
              }}
              placeholder="sk-ant-…"
              className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Model (optional)</span>
            <input
              name="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                writeStore(MODEL_STORAGE, e.target.value.trim(), rememberKey);
              }}
              placeholder="claude-opus-5-5"
              className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name="remember-key"
              checked={rememberKey}
              onChange={(e) => {
                setRememberKey(e.target.checked);
                writeStore(KEY_STORAGE, apiKey.trim(), e.target.checked);
                writeStore(MODEL_STORAGE, model.trim(), e.target.checked);
              }}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Remember key on this device (so check-in reminders continue live)
          </label>
          <p className="text-xs text-muted">
            The key is sent only to Anthropic. By default it stays in this tab only. Without a key, the coach shows clearly
            labelled sample replies.
          </p>
        </section>
      )}

      <main className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-3 pt-6 text-center">
            <p className="text-xl font-semibold">What&apos;s on your mind today?</p>
            <p className="text-sm text-muted">
              Describe a concern in English or Urdu. You&apos;ll get a short plan and a check-in.
            </p>
            <div className="flex flex-col items-center gap-2 pt-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  dir="auto"
                  onClick={() => send(ex)}
                  className="max-w-full rounded-full border border-line bg-surface px-4 py-1.5 text-sm hover:border-brand"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} data-testid="msg-user" className="flex justify-end">
              <p
                dir="auto"
                className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-user px-4 py-2 text-user-ink"
              >
                {m.content}
              </p>
            </div>
          ) : m.role === "assistant" ? (
            <div key={m.id} id={`msg-${m.id}`} data-testid="msg-coach" className="flex scroll-mt-3 justify-start">
              <ReplyCard
                reply={m.reply}
                source={m.source}
                reminded={remindedIds.includes(m.id)}
                checkedIn={messages.some((x) => x.role === "checkin" && x.forReplyId === m.id)}
                onAnswer={() => inputRef.current?.focus()}
                onRemind={() => {
                  const p = pending.find((x) => x.replyId === m.id) ?? pendingFromReply(m.id, m.reply);
                  if (!p) return;
                  downloadReminder(p);
                  setRemindedIds((ids) => [...ids, m.id]);
                }}
              />
            </div>
          ) : m.role === "checkin" ? (
            <div key={m.id} id={`msg-${m.id}`} data-testid="msg-checkin" className="flex scroll-mt-3 justify-start">
              <div
                dir={m.language === "ur" ? "rtl" : "ltr"}
                lang={m.language === "ur" ? "ur" : "en"}
                className="max-w-[34rem] rounded-2xl border border-brand/40 bg-brand-soft px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand" lang="en" dir="ltr">
                  ⏰ Check-in · welcome back
                </p>
                <p className="mt-1">{m.text}</p>
              </div>
            </div>
          ) : (
            <p key={m.id} id={`msg-${m.id}`} data-testid="msg-coach" role="alert" className="rounded-xl bg-caution-soft px-4 py-2 text-sm text-caution">
              {m.content}
            </p>
          ),
        )}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted" data-testid="thinking" role="status">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
            </span>
            Coach is preparing a plan…
          </div>
        )}
        <div ref={endRef} />
      </main>

      <footer className="border-t border-line bg-bg px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            dir="auto"
            name="concern"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            ref={inputRef}
            placeholder="Type your concern… / اپنی پریشانی لکھیں"
            aria-label="Your concern"
            maxLength={2000}
            autoFocus
            className="min-h-12 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-12 rounded-xl bg-brand px-5 font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </form>
        <p className="mt-2 text-center text-[0.7rem] text-muted">
          Not medical or legal advice. In an emergency, call your local emergency number.
        </p>
      </footer>
    </div>
  );
}
