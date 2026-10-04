# Deploying Skin Affairs

This repo holds two independent applications. They are built, configured and
deployed separately, and talk to each other over HTTPS.

| | `client/` | `server/` |
|---|---|---|
| What it is | React SPA built with Vite | Express REST API |
| Build | `npm run build` → `dist/` | none (plain Node) |
| Start | any static host | `npm start` |
| Config file | `client/vite.config.js`, `client/vercel.json` | `server/vercel.json` |
| Environment | `VITE_API_URL` | see `server/.env.example` |

> The server is a Node/Express app, so it has no Vite config — Vite only builds
> the browser bundle. `client/vite.config.js` is what makes the frontend a
> self-contained deployable: it emits a static `dist/` that can ship anywhere,
> with the API location supplied at build time by `VITE_API_URL`.

---

## 1. Deploy the server first

The client needs the API's public URL at build time, so deploy the backend
first and copy its URL.

### Environment variables

Copy `server/.env.example` and fill it in. The required ones are `MONGODB_URI`,
`JWT_SECRET` and `GEMINI_API_KEY`. ImageKit, Stripe and ClipDrop are optional —
without them the related features report that they aren't configured, and
everything else keeps working.

Set `ALLOWED_ORIGINS` (or `CLIENT_URL`) to your deployed frontend origin once
you have it, so the API isn't open to every website. `localhost` is always
allowed, so this won't lock you out of local development.

### On Vercel

- New Project → same repo → **Root Directory: `server`**
- `server/vercel.json` routes every request into `server.js`
- Add the environment variables above in Project Settings

**Two caveats on Vercel:**

- **Request body cap (4.5MB).** Photos are sent as base64, which inflates them
  by ~33%. One small photo fits; five 8MB photos do not.
- **Function timeout.** Hobby defaults to 10 seconds. An AI reply that analyses
  a photo often takes longer, and the `MODEL_CHAIN` fallback in
  `controllers/messageController.js` stacks retries on top when a model is
  overloaded — so a slow request can be cut off and surface as a failed send.
  Raise it with `maxDuration` (up to 60s on Hobby, more on Pro), or host the
  API elsewhere.

If photo analysis is central to the product, a long-running host avoids both
problems entirely.

### On Render / Railway / Fly / a VPS

- Root directory: `server`
- Build: `npm install`
- Start: `npm start`
- No body-size cap to work around, so photo uploads behave as designed

Check it with `curl https://your-api.example.com/health` → `{"success":true,"status":"ok"}`.

---

## 2. Deploy the client

### Environment variables

One variable, read at **build** time (not runtime — rebuild after changing it):

```
VITE_API_URL=https://your-api.example.com
```

Leave it empty only for local development, where the Vite dev proxy forwards
`/api` to `http://localhost:3000`.

### On Vercel

- New Project → same repo → **Root Directory: `client`**
- Framework preset: Vite (already declared in `client/vercel.json`)
- Add `VITE_API_URL`
- `client/vercel.json` rewrites all paths to `/` so client-side routes like
  `/credits` survive a page refresh, and caches hashed assets for a year

### On Netlify / Cloudflare Pages / S3

- Build command: `npm run build`
- Publish directory: `dist`
- Add a catch-all rewrite to `/index.html`, or deep links will 404

---

## 3. After both are up

1. Set `ALLOWED_ORIGINS` on the server to the client's origin and redeploy.
2. Set `CLIENT_URL` on the server — Stripe redirects back to it after checkout.
3. If using Stripe, point a webhook at `https://your-api.example.com/api/stripe`
   for `payment_intent.succeeded` and set `STRIPE_WEBHOOK_SECRET`.

---

## Local development

Two terminals:

```bash
cd server && npm install && npm run dev     # http://localhost:3000
cd client && npm install && npm run dev     # http://localhost:5173
```

The dev server also listens on your LAN, so you can open the printed Network
URL on a phone to check the mobile layout on a real device.

Useful client overrides in `client/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | empty | Backend URL. Empty = use the dev proxy |
| `DEV_API_PROXY` | `http://localhost:3000` | Where the dev proxy forwards `/api` |
| `CLIENT_PORT` | `5173` | Dev server port |
| `PREVIEW_PORT` | `4173` | `npm run preview` port |
