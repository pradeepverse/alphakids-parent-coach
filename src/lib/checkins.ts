/**
 * Serverless check-ins.
 *
 * A real "notify me in 3 days" needs web push (service worker + push server + stored
 * subscriptions), which needs a backend. Instead:
 *  - the conversation is saved in this browser (localStorage);
 *  - "Remind me" downloads a calendar event, so the phone's calendar does the notifying;
 *  - the event links back to the app with ?checkin=<replyId>, and the coach resumes the chat
 *    with the check-in question. Reopening the site after the due time also resumes it.
 */
import type { ChatMessage, CoachReply } from "./types";

const CHAT_STORAGE = "ak-coach-chat-v1";

export interface PendingCheckIn {
  replyId: string;
  dueAt: number; // epoch ms
  question: string;
  language: CoachReply["language"];
}

interface SavedChat {
  messages: ChatMessage[];
  pending: PendingCheckIn[];
}

export function loadChat(): SavedChat {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE);
    if (!raw) return { messages: [], pending: [] };
    const parsed = JSON.parse(raw) as Partial<SavedChat>;
    return { messages: parsed.messages ?? [], pending: parsed.pending ?? [] };
  } catch {
    return { messages: [], pending: [] };
  }
}

export function saveChat(chat: SavedChat) {
  try {
    if (chat.messages.length === 0 && chat.pending.length === 0) localStorage.removeItem(CHAT_STORAGE);
    else localStorage.setItem(CHAT_STORAGE, JSON.stringify(chat));
  } catch {
    /* storage unavailable (private mode etc.): chat simply isn't saved */
  }
}

const FALLBACK_QUESTION: Record<CoachReply["language"], string> = {
  en: "It's been a few days. How did the plan go?",
  ur: "کچھ دن ہو گئے ہیں۔ پلان کیسا رہا؟",
  "ur-Latn": "Kuch din ho gaye hain. Plan kaisa raha?",
};

/** Builds the pending check-in for a time-based reply (null for question-type or crisis replies). */
export function pendingFromReply(replyId: string, reply: CoachReply, now = Date.now()): PendingCheckIn | null {
  if (reply.risk === "crisis" || reply.checkIn.kind !== "time") return null;
  const hours = Math.min(Math.max(reply.checkIn.comeBackInHours ?? 72, 1), 24 * 14);
  return {
    replyId,
    dueAt: now + hours * 3600_000,
    question: reply.checkIn.resumeQuestion?.trim() || FALLBACK_QUESTION[reply.language],
    language: reply.language,
  };
}

/** Human label for the due time, e.g. "in 3 days" / "tomorrow" / "in 6 hours". */
export function dueLabel(hours: number | null | undefined): string {
  const h = hours ?? 72;
  if (h < 20) return `in ${Math.round(h)} hour${Math.round(h) === 1 ? "" : "s"}`;
  const d = Math.round(h / 24);
  return d <= 1 ? "tomorrow" : `in ${d} days`;
}

/** Resume link: the app URL with ?checkin=<replyId>. */
export function resumeUrl(replyId: string): string {
  const u = new URL(window.location.href);
  u.search = `?checkin=${encodeURIComponent(replyId)}`;
  u.hash = "";
  return u.toString();
}

const icsDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Downloads an .ics calendar event that alerts at the check-in time and links back to the chat. */
export function downloadReminder(p: PendingCheckIn) {
  const url = resumeUrl(p.replyId);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alpha Kids//Parent Coach//EN",
    "BEGIN:VEVENT",
    `UID:${p.replyId}@alphakids-coach`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(p.dueAt)}`,
    `DTEND:${icsDate(p.dueAt + 15 * 60_000)}`,
    `SUMMARY:${icsEscape("Parent coach check-in")}`,
    `DESCRIPTION:${icsEscape(`${p.question}\n\nOpen your chat: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(p.question)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "parent-coach-check-in.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
