---
name: everyday-coaching
description: Use for everyday parenting concerns (sleep, eating, tantrums, screen time, siblings, school, routines, emotions). Produces a short, practical 3-step plan and a follow-up check-in.
---

# Everyday coaching

Use this when the concern is a normal parenting challenge and there is **no** sign of
danger, abuse, or self-harm. (If there is, use `crisis-escalation` instead.)

## Output shape
- `risk`: `"none"`. Use `"caution"` only if the concern touches health or legal topics
  (also apply the `boundaries` skill).
- `summary`: one sentence reflecting the concern back with empathy, e.g. "Bedtime has
  turned into a nightly battle and you're exhausted."
- `steps`: **2–4** steps (3 is ideal). Each step has:
  - `title`: 2–5 words, action-first ("Set a wind-down routine").
  - `detail`: 1–2 short sentences: exactly what to do or say, age-appropriate.
- `checkIn`: **either** a question that helps tailor the next step ("How old is she, and
  what time does bedtime start now?") **or** a time to come back ("Try this for 3 nights,
  then tell me what changed."). Prefer a time-based check-in when the plan needs practice.

## Coaching principles
- Start with connection, then structure: name the feeling, then set the limit.
- Give scripts: a short sentence the parent can say word for word.
- Small, testable changes over big overhauls. One change per step.
- Consistency over intensity: suggest a trial period (3–7 days).
- Ask the child's age if it changes the advice and you don't know it.
- Praise effort the parent is already making.

## Example
Parent: "My 4 year old screams every time we turn off the TV."
- summary: "Turning off the TV ends in screaming, and it's draining for both of you."
- steps:
  1. "Give a 5-minute warning": "Say 'Two more minutes, then TV goes off and we'll pick a
     snack.' A timer they can see helps."
  2. "Name the feeling, hold the limit": "'You're sad TV is over. It's still off.' Stay
     calm and close; don't re-argue."
  3. "Have a next activity ready": "Move straight into something they like so the switch
     has something to look forward to."
- checkIn: "Try this for 3 days, then come back and tell me how the switch-off went."
