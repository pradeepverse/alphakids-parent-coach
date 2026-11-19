# Alpha Kids Parent Coach

A small Next.js app where a parent describes a concern in **English or Urdu** (Urdu script or
Roman Urdu) and an LLM coach replies with a **short, structured, safe plan** and a **check-in**.
The coach doesn't diagnose, doesn't give medical or legal instructions, and **escalates
emergencies, abuse and self-harm**.

The coach is a LangChain **[deepagents](https://github.com/langchain-ai/deepagentsjs)** agent
driven by **markdown skills** ([`coach/`](coach/)), running fully in the browser. The site is
a static export, so it deploys to GitHub Pages with no server or database.

## Run locally

Requires Node 20+ (tested on Node 24).

```bash
npm install
npm run dev          # http://localhost:3000
```

- **Demo mode (default):** without an API key you get clearly labelled sample replies. The
  safety check still runs, so crisis messages escalate.
- **Live mode:** click **Settings** and paste an Anthropic API key. It's kept in this tab's
  `sessionStorage` and sent only to Anthropic. Optionally set a model (default
  `claude-sonnet-5-5`).

Other commands:

```bash
npm run test:safety  # crisis-detection regression cases (EN / اردو / Roman Urdu)
npm run typecheck
npm run lint
npm run build        # static site in out/
```

## Try it
| Type | Example |
|---|---|
| Everyday (EN) | `My 4 year old screams every time we turn off the TV.` |
| Everyday (اردو) | `میرا بیٹا رات کو سوتا نہیں، بہت ضد کرتا ہے` |
| Everyday (Roman Urdu) | `Meri beti school jane se pehle roz rone lagti hai` |
| Boundary | `Does my son have ADHD? What medicine should he take?` |
| Crisis | `My 13 year old said she wants to die` |

## How it works

```
message → 1. deterministic safety check (regex, EN/UR)  ─┐ can only raise risk
        → 2. deepagents coach: AGENTS.md persona + 4 SKILL.md skills
        → 3. typed reply {risk, summary, steps[], checkIn} → cards (RTL for Urdu)
             crisis → fixed emergency banner (code, never model text)
             model fails on a crisis → fixed crisis reply
```

Skills: `everyday-coaching` · `crisis-escalation` · `boundaries` · `urdu-replies`.
Change how the coach behaves by editing markdown in [`coach/`](coach/), not code.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (architecture and safety) ·
[docs/DESIGN.md](docs/DESIGN.md) (UI) · [AGENTS.md](AGENTS.md) (guide for coding agents).

## Deploy (GitHub Pages)
Push to `main`. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds the static
export with the right base path and publishes it. In the repo, set **Settings → Pages → Source:
GitHub Actions**.

## Notes and limits
- Bring-your-own-key in the browser suits a demo. In production the agent would sit behind a
  small server so the key never reaches the client.
- Emergency guidance is deliberately generic ("call your local emergency number"); no
  country-specific numbers.
- Not medical or legal advice.
