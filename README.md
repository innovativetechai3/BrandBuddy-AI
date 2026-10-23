# BrandBuddy AI

**Multilingual AI-powered content studio for small businesses.**

BrandBuddy AI helps small businesses, clothing brands, restaurants, beauty businesses, and freelancers create marketing content efficiently.

## Features

- Generate 3 social media captions and a product description for any product or service.
- Create content in **English**, **Urdu** (Nastaliq script, right-to-left) and **Roman Urdu**.
- Generate relevant hashtags and 3 campaign ideas.
- Choose business type, tone (friendly, festive, luxury…) and platform (Instagram, Facebook, WhatsApp, TikTok).
- Brand kit (name, tagline, two colours) saved in your browser.
- Download any caption as a branded square **PNG** image, ready to post.
- Copy buttons for captions, descriptions and hashtags.
- Last 10 generations saved in your browser ("Recent").
- Works on phones, tablets and desktops.

## Technology

| Part | Choice | Cost |
| --- | --- | --- |
| Website + API | Next.js 16 (App Router, TypeScript, Tailwind CSS) | Free |
| AI | Google Gemini API, free tier (called only from the server) | Free |
| Hosting | Vercel Hobby plan | Free |
| Storage | Browser `localStorage` (no database) | Free |
| Version control | GitHub | Free |

### How the Gemini key stays secret

```
Browser  ──POST /api/generate──▶  Vercel server function  ──▶  Gemini API
(no key)                          (reads GEMINI_API_KEY)
```

- The key is read only in `src/lib/ai.ts`, which is marked `server-only`, so Next.js refuses to bundle it into browser code.
- The key lives in Vercel's **Environment Variables** (or a local `.env.local` file). Every `.env*` file except `.env.example` is ignored by Git, so the key is never committed.

## Project structure

```
src/
  app/
    page.tsx              Home page
    layout.tsx            Fonts (incl. Noto Nastaliq Urdu) and page shell
    api/generate/route.ts Server API route: validates input, applies daily limit, calls Gemini
  components/
    Studio.tsx            Form, brand kit and history
    Results.tsx           Language tabs, captions, PNG export, copy buttons
  lib/
    ai.ts                 Gemini call + prompt (server only)
    schema.ts             Input/output validation (Zod)
    rateLimit.ts          Simple per-visitor daily cap
    storage.ts            Browser storage helpers
.env.example              List of environment variables (no real values)
```

## Deploy to Vercel (step by step, no coding needed)

You only need a web browser. Nothing has to be installed on your computer.

1. **Merge the code into `main`.** On GitHub, open the pull request for this version, review it, and press **Merge pull request**.
2. **Sign in to Vercel.** Go to [vercel.com](https://vercel.com) and log in with **Continue with GitHub**.
3. **Import the repository.** Click **Add New… → Project**. Find **BrandBuddy-AI** and click **Import**. (If it is not listed, click **Adjust GitHub App Permissions** and allow Vercel to see this repository.)
4. **Keep the defaults.** Vercel detects *Next.js* automatically. Do not change the build settings.
5. **Add your Gemini key.** Open **Environment Variables** on the same screen and add:
   - Name: `GEMINI_API_KEY`
   - Value: your key from [Google AI Studio](https://aistudio.google.com/apikey)

   Paste it only here. Never put it in a GitHub file, a screenshot, or a chat.
6. **Click Deploy.** Wait 1–2 minutes. Vercel gives you a free address like `brandbuddy-ai.vercel.app`.
7. **Test it.** Open the address, click **Try an example**, then **Generate content**.

After this, every time new code is merged into `main`, Vercel redeploys automatically. Pull requests get their own free *preview* link so you can test changes before merging.

**If you add or change the key later:** Vercel → your project → **Settings → Environment Variables** → edit → then **Deployments → ⋯ → Redeploy**. Environment variables only apply to new deployments.

### Optional settings

| Variable | Default | What it does |
| --- | --- | --- |
| `GEMINI_MODEL` | (empty) | A Gemini model to try first. If unset, the app tries `gemini-3.5-flash`, then `gemini-flash-lite-latest`, then `gemini-flash-latest`, moving on whenever one is busy or retired. |
| `DAILY_LIMIT_PER_VISITOR` | `20` | Maximum generations per visitor per day, to protect your free quota. |

## Free-tier limitations (PKR 0 budget)

- **Gemini free tier has rate limits.** There is a cap on requests per minute and per day, and Google changes these numbers from time to time. Check your current limits in [Google AI Studio](https://aistudio.google.com) under *Usage / Rate limits*. When the limit is reached, the app shows a friendly "quota used up, try again later" message; daily quotas reset at midnight Pacific time (around 12–1 pm in Pakistan).
- **Google may use free-tier prompts to improve its products.** Do not type private customer data into the form.
- **No card = no surprise bills.** As long as you do not enable billing in Google Cloud, the key cannot be charged.
- **Vercel Hobby is for personal, non-commercial use.** It is fine for building and testing. When you start charging customers, Vercel's terms require the Pro plan (paid), or you can move to another free host.
- **The per-visitor daily limit is best effort.** It is kept in server memory, so it resets when Vercel restarts the function. A database (e.g. Supabase free tier) can make it strict later.
- **Brand kit and history live in one browser.** Clearing browser data or switching device loses them. There are no user accounts yet.
- **AI output can contain mistakes,** especially in Urdu spelling. Always review before posting.

## Run locally (optional, for developers)

```bash
npm install
cp .env.example .env.local   # then paste your key into .env.local
npm run dev                  # open http://localhost:3000
```

## Not included yet

User accounts, payments, and posting directly to social media are planned for later versions.

## Project Status

First working version (MVP).
