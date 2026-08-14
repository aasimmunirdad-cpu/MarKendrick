# Markendrick App — Deployment Notes

This is the codebase Emergent built (React frontend + FastAPI backend + MongoDB),
cleaned up and verified to run outside Emergent's platform. What changed and what's
still needed before going live is below.

## What was fixed and verified

- **Backend dependencies trimmed.** `backend/requirements.txt` had unused packages
  (Stripe, OpenAI, Google AI SDKs, boto3/S3, an Emergent-hosted wheel URL) that
  aren't imported anywhere in `server.py` and would break installs on a normal
  host. Removed. Verified a fresh install + full route smoke test (auth, posts,
  case studies, leads, whitepapers, testimonials, sitemap) all pass.
- **Upload path fixed.** `UPLOAD_DIR` was hardcoded to `/app/backend/uploads`
  (Emergent's container layout). Now defaults to a folder next to `server.py`
  and can be overridden with the `UPLOAD_DIR` env var.
- **JWT secret rotated.** The one shipped in `.env` is replaced; treat the new
  one as a placeholder too — generate a fresh one before production
  (`python3 -c "import secrets; print(secrets.token_hex(32))"`).
- **`.env.example` added** (`backend/.env.example`) with placeholders and notes
  for every variable, including the two options for email (Emergent's proxy vs.
  your own Resend key).
- **Frontend dependency conflicts resolved.** React 19 + several older build
  tools (`react-day-picker`, multiple bundled `ajv`/`schema-utils` versions
  across `terser-webpack-plugin`, `fork-ts-checker-webpack-plugin`,
  `file-loader`, `babel-loader`) don't declare compatibility with each other
  yet. Pinned via `overrides` in `package.json` so `npm install` and
  `npm run build` both work cleanly. Verified: clean install, full production
  build (`Compiled successfully`, ~222 KB JS / 12 KB CSS gzipped), output
  serves valid HTML/JS/CSS.
- **Removed Emergent's IDE-only dependency** (`@emergentbase/visual-edits`) —
  it's a dev-mode overlay for their editor and the code already handles it
  being absent gracefully.
- **Lint-during-build disabled** (`DISABLE_ESLINT_PLUGIN=true`, baked into the
  `build` script) — it was hitting the same tooling version gap; lint is now a
  separate `npm run lint` step so it doesn't block production builds.

## Still needed before this goes live

1. **A real MongoDB.** [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
   works. Put the connection string in `backend/.env` as `MONGO_URL`.
2. **A host for the backend.** Needs to run a persistent Python process —
   Railway or Render are the simplest options and both support FastAPI +
   MongoDB out of the box.
3. **A host for the frontend.** Any static host works once `npm run build`
   is run (Vercel, Netlify, or the same Railway/Render service).
4. **Rotate every secret in `.env`** before deploying: `JWT_SECRET`,
   `ADMIN_PASSWORD`, and decide on the email provider (see below).
5. **Pick an email path:**
   - Keep using Emergent's managed proxy (`EMERGENT_EMAIL_KEY`) — requires an
     active Emergent subscription.
   - Or switch to your own [Resend](https://resend.com) account — swap the
     `send_email()` function in `backend/server.py` (currently posts to
     `integrations.emergentagent.com`) for a direct Resend API call.
6. **SEO note:** this is a client-rendered React SPA, not server-rendered.
   Modern Google crawling handles this reasonably well, but it's slower to
   index than plain HTML, and other crawlers/link-preview bots may not
   execute JavaScript at all (affecting social share previews unless handled
   separately). Worth keeping in mind given SEO is central to Markendrick's
   positioning.
7. **Review seeded content** — the 6 blog posts, 3 case studies, and 2 of the
   3 testimonials are fictional placeholder content Emergent generated. Real
   copy needed before launch.

## Running locally

Backend:
```
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# point MONGO_URL at a real MongoDB instance in .env, then:
uvicorn server:app --reload --port 8000
```

Frontend:
```
cd frontend
npm install --legacy-peer-deps
npm run build      # production build → frontend/build/
# or for local dev:
npm start
```
