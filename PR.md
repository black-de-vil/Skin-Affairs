# PR: AI Skin Expert with Photo Analysis, Community & Auth Improvements

## Title

**feat/ai-expert-image-analysis — AI skincare expert with multi-photo analysis, community features, and authentication**

## Description

### What's new

This branch turns the chat into a **specialized AI skincare expert** and adds the ability to **analyse user-uploaded skin photos**, alongside several community and developer-experience improvements.

#### 1. AI skin-expert behaviour (Server)
- Added a master **system prompt** (`server/controllers/messageController.js`) that:
  - Keeps the assistant in the role of a warm, evidence-based skincare/dermatology consultant.
  - **Limits scope** to skin-related topics — off-topic requests (e.g. "create a website", coding, general trivia) are politely declined and steered back to skin care.
  - Adds medical safety disclaimers and refers serious/untreated conditions to a licensed dermatologist.
- **Model resilience**: a fallback chain (`gemini-3.7-flash → gemini-3.5-flash → gemini-flash-latest`) retries transient 503/429/overload errors automatically so chat keeps working during demand spikes.

#### 2. Multi-photo upload & analysis (Client + Server)
- Chat input now supports **attaching up to 5 photos per message** (8MB each), with:
  - Preview thumbnails, per-image remove, and a `n/5` counter.
  - Validation for file type, size, and count.
- Photos are uploaded to **ImageKit** for chat-history display, and the original base64 data is sent to Gemini for **vision-based skin analysis** (Gemini's OpenAI endpoint only accepts inline data URLs, so we pass the original bytes rather than the remote URL).
- UI renders all attached photos inside the user message bubble.

#### 3. Community features (Server routes)
- **Published imagery**: `GET /api/user/published-images`.
- **Like toggling**: `POST /api/user/toggle-like-image` (protected).
- `createChat` now returns the created chat object directly.

#### 4. Developer experience / fixes
- Fixes a React hooks-order crash in `App.jsx` (`useMemo` moved above early returns).
- Adds **Vite dev proxy** for `/api → localhost:3000`.
- Adds `client/.env.example` template and hardens `client/.gitignore` for env files.
- Raises the Express JSON body limit to `64mb` to fit multi-photo payloads.
- Added `client/src/pages/Auth.jsx`.

### Breaking changes
- None. Existing text-only chat flow remains unchanged; images are optional.

### Security
- **No secrets are committed.** The local `server/env` file (live Stripe + Gemini keys) was excluded from the branch/repo.

### How to test
1. Start the server (`npm run server`) and client (`npm run dev`).
2. Log in / create an account.
3. Ask a skin question — replies should stay on-skin-topic.
4. Attach 1–5 photos of your skin and send — the assistant should analyse the image(s).
5. Try attaching a 6th image — the client should block it with the max limit message.

### Files changed
- `server/controllers/messageController.js` — system prompt, vision, fallback chain, multi-image handling
- `server/models/Chat.js` — `image[]` field on messages
- `server/server.js` — 64mb body limit
- `server/controllers/chatController.js` — return created chat
- `server/routes/userRoutes.js` — community routes
- `server/controllers/userController.js` — published images + like toggle
- `client/src/components/ChatBox.jsx` — multi-photo upload UI
- `client/src/context/AppContext.jsx` — image-aware `sendMessage`
- `client/src/App.jsx` — hooks-order fix, message normalisation
- `client/vite.config.js` — dev proxy
- `client/.env.example`, `client/.gitignore`
- `client/src/pages/Auth.jsx`, `client/src/components/Sidebar.jsx`, `client/src/pages/Community.jsx`