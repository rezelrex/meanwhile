# Meanwhile 🌙

A soft little window for two — share photos & clips, leave notes, stick your
mascots anywhere, and watch a cat swoon when you leave a heart. Everything is
saved to a shared backend, so it persists forever and syncs between both of you.

This is a **Vite + React** app with two tiny serverless functions (`/api`) that
use **Vercel Blob** to store the photos/videos and the shared feed.

---

## Deploy it (about 5 minutes, all free tier)

You'll need a free **Vercel** account: https://vercel.com/signup

### Option A — GitHub (recommended)
1. Put this folder in a new GitHub repository (drag the files into a new repo,
   or `git init && git add . && git commit -m "meanwhile" && git push`).
2. In Vercel, click **Add New… → Project**, import that repo, and click **Deploy**.
   Vercel auto-detects Vite — leave the build settings as the defaults.

### Option B — Vercel CLI (no GitHub)
1. Install the CLI: `npm i -g vercel`
2. In this folder run `vercel` and follow the prompts (accept defaults).
3. When you're happy, run `vercel --prod`.

> The first deploy will succeed but **won't save anything yet** — do the next step.

---

## Turn on storage (one click — this is what makes it save)
1. Open your project in the Vercel dashboard → **Storage** tab.
2. **Create / Connect** a **Blob** store, and connect it to this project.
   Vercel automatically adds a `BLOB_READ_WRITE_TOKEN` environment variable —
   you never have to copy or paste a key.
3. Go to **Deployments** and **Redeploy** the latest one so it picks up the token.

That's it — now every photo, note, heart, and sticker is saved permanently and
shows up for both of you, even after you close the tab.

---

## Optional — make it private to just the two of you
By default anyone with the link can post. To lock it:
1. Project → **Settings → Environment Variables**.
2. Add `ROOM_PASSPHRASE` = any secret phrase you both agree on.
3. **Redeploy.** The site will now ask for that passphrase on first visit
   (each of you types it once on your own device).

---

## Run it locally first (optional)
```bash
npm install
npm run dev
```
Local dev won't have Blob storage unless you add a `BLOB_READ_WRITE_TOKEN` to a
`.env.local` file (`vercel env pull` can fetch it after you've connected the store).
Without it, posting will error locally — that's expected; it works once deployed.

---

## Good to know
- **Your name + mascot** are stored on your own device (localStorage), so each of
  you sets your own. The posts, hearts, notes, and stickers are the shared part.
- **Sync** happens by polling every few seconds, so the other person's updates
  appear within a few seconds.
- **Conflicts:** if you both edit at the exact same instant, last-write-wins.
  Fine for two people; not built for crowds.
- **Media size:** images are auto-shrunk before upload; the upload route allows
  clips up to 60 MB. Vercel's free Blob tier has a monthly storage limit — plenty
  for two people, but not unlimited.
- **Privacy note:** the passphrase gates *posting/reading the feed*. Photo URLs
  themselves are public-but-unguessable Blob links. It's privacy-by-obscurity,
  not bank-grade security.
```
