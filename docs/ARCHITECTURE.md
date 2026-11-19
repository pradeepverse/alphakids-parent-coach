# Architecture & Safety Design

## Goal
A parent types a concern (English, Urdu script, or Roman Urdu). The coach replies with a
**short, structured, safe plan** and a **check-in** (a question or a time to come back). It
never diagnoses, never gives medical or legal instructions, and **always escalates** emergencies,
abuse and self-harm.

## Request flow (all in the browser)

```
 parent message
      │
      ▼
 ┌──────────────────────────┐   crisis?   ┌───────────────────────────────┐
 │ 1. checkSafety()          │───────────▶│ crisisHint passed to agent      │
 │ deterministic regex,      │            │ + risk forced to "crisis"       │
 │ EN / اردو / Roman Urdu     │            │ + fixed crisisReply() if the    │
 └──────────────────────────┘            │   model fails or there's no key │
      │                                   └───────────────────────────────┘
      ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ 2. deepagents agent (deepagents/browser + ChatAnthropic)     │
 │    memory: /AGENTS.md         (persona + core rules)         │
 │    skills: /skills/*/SKILL.md (loaded on demand by the model)│
 │      everyday-coaching · crisis-escalation · boundaries ·    │
 │      urdu-replies                                            │
 │    files: read-only (permissions deny write)                 │
 │    output: providerStrategy(schema) → native JSON output     │
 └──────────────────────────────────────────────────────────────┘
      │
      ▼
 ┌──────────────────────────┐
 │ 3. Merge + render          │  risk = max(code check, model)
 │ ReplyCard: summary, steps, │  crisis → fixed EmergencyBanner (code, not model text)
 │ check-in; RTL for Urdu     │
 └──────────────────────────┘
```

No key → **demo mode**: the same safety check runs, then a clearly labelled pre-written
reply (`fallbacks.ts`) is shown. This keeps the GitHub Pages site explorable without
exposing or paying for a key.

## Why deepagents + markdown skills
- **Behaviour lives in markdown** (`coach/`), so non-engineers (coaches, child-safety
  reviewers, translators) can review and change *how the coach behaves* without touching code.
- **Progressive disclosure:** only skill names and descriptions sit in the prompt; the model reads
  the full `SKILL.md` it needs. Adding a skill (say, `toddler-sleep`, `teen-screens`) is
  adding a folder.
- `coach/AGENTS.md` is loaded as deepagents **memory**: the always-on persona and rules.
- Trade-off: an agent loop is slower than one prompt (it reads a skill file first). That's
  acceptable for a coaching product, and the safety check doesn't depend on it.

## Safety: defence in depth
| Layer | What | Why it exists |
|---|---|---|
| 1. Deterministic check | `src/lib/safety.ts`: regex for emergency / abuse / self-harm in EN, Urdu script, Roman Urdu | Skills are only followed if the model loads them. A code check can't be talked out of escalating. Deliberately over-triggers. |
| 2. Skill | `crisis-escalation` and `boundaries` SKILL.md | Catches subtler cases the regex misses and writes a caring, language-matched reply. |
| 3. Merge rule | code check can only **raise** risk | The model can never downgrade a flagged crisis. |
| 4. Fixed UI | `EmergencyBanner` is static code | Emergency instructions are never model-generated, so they can't be hallucinated. |
| 5. Failure path | `crisisReply()` if the model errors or no key | A crisis is never left unanswered. |

**Product decisions:** generic "call your local emergency number" with no country hotlines
(avoids wrong numbers across UAE, Pakistan and elsewhere). Ambiguous messages are escalated
(a false alarm costs seconds; a miss can cost a life).

**Known limits:** regex can't understand context ("my son is killing me" is handled, but
novel phrasing may slip past layer 1 and rely on layer 2). Next step: a small classifier model
call or moderation API as an extra layer, plus a labelled eval set.

## Language
`urdu-replies` skill: reply in the parent's language **and script** (`en` / `ur` / `ur-Latn`).
The UI sets `dir="rtl"` and the Nastaliq font for `ur`; input uses `dir="auto"`.

## Deployment & keys
- `output: "export"`: plain static files on GitHub Pages; no server, no database, no login.
- Live mode: the user pastes their own Anthropic key. It's kept in `sessionStorage` and sent
  only to `api.anthropic.com` (`dangerouslyAllowBrowser`). That's fine for a demo or BYO-key tool.
  **For production**, move the agent behind a small server or edge function so the key never
  reaches the browser. The agent code is the same.
- Node-only imports pulled in by deepagents (`ws`, `node:async_hooks`) are aliased to small
  browser stubs in `next.config.ts`.

## Considered and not used
- **A2UI (agent-generated UI):** our reply has a fixed shape, so a typed schema and fixed React
  cards are simpler. More importantly, crisis UI must be fixed, reviewed code, not model-composed
  layout. Worth revisiting if the coach starts generating interactive widgets (check-in
  scheduler, routine tracker).
- **Subagents per domain:** more moving parts and latency; one agent with four skills is enough.
- **Server API route:** dropped for GitHub Pages; see "Deployment & keys".

## What I'd do next
Server-side key and rate limiting · eval set of ~100 labelled concerns (EN/UR) run in CI ·
streaming replies · persisted check-in reminders · native-speaker review of the Urdu skill.
