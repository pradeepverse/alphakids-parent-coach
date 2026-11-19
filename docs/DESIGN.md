# UI Design

## Principles
1. **Calm, not clinical.** Warm off-white background, soft green brand colour: a parenting
   app, not a hospital portal.
2. **Scannable in 10 seconds.** A stressed parent on a phone should read one summary line,
   2–4 numbered steps, and one check-in, with nothing else competing for attention.
3. **Danger is unmistakable.** Crisis replies change the whole card (red border plus a top
   alert banner) so they can't be mistaken for advice.
4. **Bilingual by default.** Urdu isn't a translation add-on: right-to-left layout, a proper
   Nastaliq font, and placeholder text in both languages.

## Layout (mobile-first, max width 42rem)
```
┌───────────────────────────────────┐
│ Alpha Kids Parent Coach  [Demo][⚙]│  header: title, mode badge, settings
├───────────────────────────────────┤
│              ┌──────────────────┐ │
│              │ parent message   │ │  user bubble (right, brand green)
│              └──────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ summary sentence              │ │  reply card (left)
│ │ YOUR PLAN                     │ │
│ │ ① Title                       │ │
│ │   detail                      │ │
│ │ ② …  ③ …                      │ │
│ │ ⏰ Check-in: try for 3 nights │ │  check-in chip (brand tint)
│ └───────────────────────────────┘ │
├───────────────────────────────────┤
│ [ Type your concern… / اردو ] Send│  composer: Enter sends, Shift+Enter newline
│ Not medical or legal advice…      │  permanent footer disclaimer
└───────────────────────────────────┘
```

## Reply card states
| `risk` | Visual treatment |
|---|---|
| `none` | Neutral card, green step numbers |
| `caution` | Amber strip: "Outside what a coach can advise on" |
| `crisis` | Red border, red 🚨 banner with fixed emergency text, red step numbers |

Source labels (small, muted): **Demo reply** (no key) and **Safety fallback** (model failed on
a flagged message). Live replies have no label.

## Colour tokens (`globals.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #fbf8f3 | #12171a | page |
| `--surface` | #ffffff | #1b2226 | cards, inputs |
| `--brand` | #2f6f5e | #6cc3a6 | title, step numbers, Send |
| `--brand-soft` | #e3f0eb | #1d3530 | check-in chip, step badges |
| `--caution` / `-soft` | #8a5a00 / #fff4dc | #f2c26b / #3a2f17 | boundaries notice, demo badge |
| `--crisis` / `-soft` | #b42318 / #fdecea | #ff8a80 / #3d1a17 | emergency banner |

Dark mode follows the system (`prefers-color-scheme`).

## Typography
- Latin: Geist. Urdu: **Noto Nastaliq Urdu** with `line-height: 2.2` (Nastaliq needs room).
- Body around 15px; step titles semibold; meta text 11–12px muted.

## Right-to-left and language
- Reply cards set `dir` and `lang` from the model's `language` field (`ur` → right-to-left).
- User bubbles, example chips and the composer use `dir="auto"`, so mixed input lays itself out.
- The emergency banner is fixed text: for Urdu or Roman Urdu replies it shows **Urdu first
  (right-to-left), then English**, so anyone nearby can read it. Next step: native-speaker review.

## States
- **Empty:** prompt "What's on your mind today?" plus 3 tappable examples (English,
  Urdu script, Roman Urdu).
- **Loading:** animated dots + "Coach is preparing a plan…" (agent replies take a few seconds).
- **New chat:** header button clears the conversation (history lives only in the page).
- **Error:** amber inline alert; a rejected key points the user to Settings and demo mode.

## Accessibility
`aria-live="polite"` on the message list, `role="alert"` for the emergency banner and errors,
labelled inputs, visible focus rings, touch targets of at least 36–48px, 16px input text (no iOS
zoom), safe-area padding for phones with a home bar, and colour never the only signal (crisis also
has an icon, text and border).
