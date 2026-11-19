import type { CoachReply, ReplySource } from "@/lib/types";

const LABELS = {
  en: { plan: "Your plan", checkIn: "Check-in", cautionTitle: "Outside what a coach can advise on" },
  ur: { plan: "آپ کا پلان", checkIn: "اگلا قدم", cautionTitle: "یہ کوچ کے دائرے سے باہر ہے" },
  "ur-Latn": { plan: "Aap ka plan", checkIn: "Check-in", cautionTitle: "Yeh coach ke daairay se bahar hai" },
} as const;

export function ReplyCard({ reply, source }: { reply: CoachReply; source: ReplySource }) {
  const rtl = reply.language === "ur";
  const L = LABELS[reply.language];
  const crisis = reply.risk === "crisis";
  const caution = reply.risk === "caution";

  return (
    <article
      dir={rtl ? "rtl" : "ltr"}
      lang={reply.language === "ur" ? "ur" : "en"}
      data-risk={reply.risk}
      className={`w-full max-w-[34rem] rounded-2xl border bg-surface shadow-sm overflow-hidden ${
        crisis ? "border-crisis" : "border-line"
      }`}
    >
      {crisis && <EmergencyBanner urdu={reply.language !== "en"} />}
      {caution && (
        <div className="bg-caution-soft text-caution px-4 py-2 text-sm font-medium" role="note">
          {L.cautionTitle}
        </div>
      )}

      <div className="px-4 pt-3 pb-4 space-y-3">
        <p className="text-[0.95rem]">{reply.summary}</p>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{L.plan}</h3>
          <ol className="space-y-2">
            {reply.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    crisis ? "bg-crisis text-white" : "bg-brand-soft text-brand"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-[0.95rem]">{s.title}</p>
                  <p className="text-sm text-muted">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-brand-soft px-3 py-2 text-sm">
          <span aria-hidden>{reply.checkIn.kind === "time" ? "⏰" : "💬"}</span>
          <p>
            <span className="font-semibold">{L.checkIn}: </span>
            {reply.checkIn.text}
          </p>
        </div>

        {source !== "live" && (
          <p className="text-[0.7rem] text-muted" dir="ltr">
            {source === "demo" ? "Demo reply (no API key set): sample answer, not generated live." : "Safety fallback: fixed emergency guidance."}
          </p>
        )}
      </div>
    </article>
  );
}

/** Fixed, code-defined emergency guidance. Rendered whenever risk = crisis, regardless of model output. */
function EmergencyBanner({ urdu }: { urdu: boolean }) {
  return (
    <div className="bg-crisis-soft text-crisis px-4 py-3 space-y-2" role="alert">
      {urdu && (
        <div dir="rtl" lang="ur" className="urdu">
          <p className="font-bold">🚨 اس کے لیے فوری مدد ضروری ہے</p>
          <p className="text-sm">
            اگر ابھی کسی کو خطرہ ہے تو <strong>فوراً اپنے علاقے کے ایمرجنسی نمبر پر کال کریں</strong>۔ یہ کوچ ایمرجنسی،
            زیادتی یا خود کو نقصان پہنچانے کے معاملات میں مدد نہیں کر سکتا۔ کسی ڈاکٹر، بچوں کے تحفظ کے ادارے یا کرائسس
            ہیلپ لائن سے رابطہ کریں۔
          </p>
        </div>
      )}
      <div dir="ltr" lang="en" className={urdu ? "border-t border-crisis/20 pt-2" : ""}>
        <p className="font-bold">🚨 This needs real-world help now</p>
        <p className="text-sm mt-1">
        If anyone is in immediate danger, <strong>call your local emergency number now</strong>. This coach can&apos;t
        handle emergencies, abuse, or self-harm. Please reach a doctor, local child-protection service, or a crisis
        helpline.
      </p>
      </div>
    </div>
  );
}
