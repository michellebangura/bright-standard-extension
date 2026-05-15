# Bright Standard — Chrome Extension

Scores any TPT lesson against the Five Checks framework before a teacher buys it.

## What it does

Opens on any `teacherspayteachers.com/Product/*` page and shows a floating panel with:

- **Five Checks scores** — Rigor, Inclusivity, Perspectives, Empathy, Critical Thinking — each 0-5
- **Certified** badge if the lesson passes (4+ on all five)
- **Specific improvement suggestions** per failing dimension  
- **Links to certified alternatives** on Bright Standard

## Install (development)

1. Clone this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select this folder

Activates automatically on TPT product pages.

## Architecture

```
content.js     — runs on TPT pages, scrapes, calls API, renders panel
content.css    — panel styles (Bright Standard dark design system)
popup.html/js  — extension popup
background.js  — service worker, badge management
manifest.json  — MV3 manifest
```

## Scoring API

`POST https://gexxdsiowglhrxkkvsrv.supabase.co/functions/v1/score-content`

Results cached by TPT URL. Same lesson is only scored once.

## Five Checks

| Dimension | Question |
|---|---|
| Rigor | Does this demand real cognitive work? |
| Inclusivity | Does this work for all students regardless of ability or budget? |
| Perspectives | Does this surface multiple viewpoints and underrepresented voices? |
| Empathy | Does this build emotional intelligence? |
| Critical Thinking | Does this teach students to question and reason for themselves? |

**Certification = 4+ on all five. No exceptions.**

## The flywheel

- Extension (free) → drives TPT traffic to Bright Standard
- Creator certification (paid) → TPT sellers pay for improvement guidance + the badge
- Import & improve (subscription) → teachers import bad content, get the AI-fixed version
- Content factory → Bright Standard publishes $1 certified lessons on TPT, competes economically

Built by Bright Standard · thebrightstandard.com
