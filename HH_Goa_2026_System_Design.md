# HH Goa 2026 — Frame / ID Card Generator
## System Design (Speed-Optimized)

**Deadline:** 11:59 PM, 13th August 2026
**Design goal:** upload → finished graphic in **under 2 seconds**, on a phone, on average mobile data.

---

## 1. Stack Choice — Optimized for Speed, Not Familiarity

Flutter Web is dropped here on purpose: its runtime (CanvasKit/Wasm bundle) costs **1.5–3MB+ and 1–2s of boot time** before a single pixel renders — the wrong trade for a one-shot, first-visit, mobile tool where every user is new (no repeat-visit caching benefit). A plain, tiny frontend beats it on the metric that matters: **time to first interaction**.

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vite + vanilla TS (or Preact)**, native `<canvas>` | ~20–40KB JS, no framework boot cost, direct Canvas 2D API access — fastest possible path from file-select to pixels |
| Image compositing (client) | **Canvas 2D API** (not WebGL — overkill for a flat composite) | Instant, GPU-accelerated by the browser itself, zero library weight |
| HEIC decode | **`heic2any`** (WASM, client-side) *or* edge function fallback | Avoids a network round-trip for the common case; server fallback only if client WASM decode fails |
| Backend / API | **Cloudflare Workers** (not a traditional Node server) | No cold start (~0ms vs Node's 300ms–2s cold start on Render/Railway free tiers), runs at the edge nearest the user, scales to zero cost at idle |
| Server-side image render (for OG) | **`@cf-wasm/photon`** or **`resvg` + `satori`** inside the Worker | Runs in the same edge request — no separate service hop |
| Storage | **Cloudflare R2** (S3-compatible, zero egress fees) | Generated PNGs served directly from edge cache, no origin round-trip on repeat fetch |
| Metadata / short-id lookup | **Cloudflare KV** | Sub-ms reads at the edge, matches Worker runtime natively |
| CDN | **Cloudflare's network (built-in)** | Frontend, API, and storage all sit on one edge network — no cross-provider latency |
| Hosting frontend | **Cloudflare Pages** | Same network as the Worker/R2 — zero extra DNS/TLS hops |

**Net effect:** frontend, API, compositing, and storage all live on **one edge network**, so there's no "your Node server in us-east-1 is slow for a user in Goa" problem — every request is served from the nearest edge PoP.

---

## 2. High-Level Architecture

```
                              ┌────────────────────────────┐
                              │      Cloudflare Pages         │
                              │  (static frontend, ~40KB JS)   │
                              │  Vite + TS + Canvas 2D          │
                              └───────────────┬────────────┘
                                              │ HTTPS (edge-local)
                                              ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                     Cloudflare Worker (API)                    │
        │                                                                  │
        │  POST /heic-fallback   → decode HEIC → PNG (only if client fails)│
        │  POST /generate         → composite image server-side            │
        │  GET  /c/:id             → OG-tagged HTML share page              │
        │  GET  /i/:id.png          → serves generated PNG (cached at edge)  │
        └───────────┬───────────────────────────────────┬─────────────────┘
                    │                                    │
                    ▼                                    ▼
        ┌───────────────────┐                ┌───────────────────────┐
        │   Cloudflare KV     │                │      Cloudflare R2       │
        │  id → metadata        │                │  generated PNGs stored   │
        │  (name, role, ts)      │                │  by id, served w/ far-     │
        │                          │                │  future cache headers      │
        └───────────────────┘                └───────────────────────┘
```

---

## 3. Request Flow (Sequence)

```
User Phone         Frontend (Pages)        Worker API           R2 / KV          X (Twitter)
    │                     │                      │                    │                 │
    │  select photo        │                      │                    │                 │
    ├────────────────────▶│                      │                    │                 │
    │                     │ decode + downscale     │                    │                 │
    │                     │ (client canvas, <200ms) │                    │                 │
    │                     │                      │                    │                 │
    │                     │ composite frame/badge   │                    │                 │
    │                     │ locally → show PNG NOW    │                    │                 │
    │◀────────────────────┤ (perceived speed: instant)│                    │                 │
    │                     │                      │                    │                 │
    │                     │ POST /generate (async,     │                    │                 │
    │                     │ same bytes, background)     │                    │                 │
    │                     ├─────────────────────▶│                    │                 │
    │                     │                      │ composite w/ Photon   │                 │
    │                     │                      │ store PNG + meta        ├────────────────▶│
    │                     │                      │                    │                 │
    │                     │◀─────────────────────┤ return short id         │                 │
    │                     │                      │                    │                 │
    │  tap "Share to X"     │                      │                    │                 │
    ├────────────────────▶│ open twitter.com/intent │                    │                 │
    │                     │  ?text=...%23FrameInGoa   │                    │                 │
    │                     │  &url=.../c/{id}            │                    │                 │
    │                     │                      │                    │                 │
    │                     │                      │                    │  GET /c/{id}      │
    │                     │                      │                    │  crawler fetches  │
    │                     │                      │                    │  OG image ────────▶│
```

**Key trick for perceived speed:** the client-composited image is shown to the user **immediately** (it's just a local canvas render, ~100–300ms). The server-side render for the shareable OG link happens **in the background**, in parallel with the user looking at/downloading their result. By the time they tap "Share," the id is almost always already back.

---

## 4. Timing Budget (target breakdown)

```
 0ms                                                                    2000ms
 │────────┬──────────┬───────────┬────────────┬───────────────────────────│
 │ upload  │ decode +  │ client     │  paint      │  (parallel, non-blocking)  │
 │ select  │ downscale │ composite   │  to screen   │  server render + upload    │
 │ (0ms)   │ (~150ms)  │ (~100ms)    │  (~50ms)      │  → R2 (~400–800ms)         │
 └────────┴──────────┴───────────┴────────────┴───────────────────────────┘
   ▲ user sees final graphic at ~300ms                    ▲ share-ready id
                                                              lands by ~800ms
                                                              (usually before
                                                              user finishes
                                                              looking at result)
```

If server render isn't back yet when the user taps Share, the button shows a ~0.5s spinner as the only wait state in the whole flow — everything else is instant.

---

## 5. Image Pipeline Detail

```
┌──────────────┐   ┌───────────────┐   ┌────────────────┐   ┌───────────────┐
│  Raw upload    │──▶│  Downscale to   │──▶│  Smart-crop into  │──▶│  Composite frame │
│  (JPG/PNG/HEIC) │   │  max 1200px long  │   │  target aspect      │   │  + text layer      │
│                  │   │  edge (canvas       │   │  (cover-fit,          │   │  (single flatten)   │
│                  │   │  drawImage scale)     │   │  top-weighted)          │   │                      │
└──────────────┘   └───────────────┘   └────────────────┘   └───────────────┘
                                                                          │
                                                                          ▼
                                                              ┌───────────────────┐
                                                              │  export PNG (client) │
                                                              │  + re-run in Worker    │
                                                              │  for the OG copy         │
                                                              └───────────────────┘
```

- **Downscale first, always** — this is the single biggest lever. A 12MP iPhone photo (~4000×3000) has no business being processed at full res; scaling to 1200px on the long edge before any compositing cuts canvas work by ~90%+ with no visible quality loss at the output sizes X displays (1080×1080 / 1080×1350).
- **Cover-fit crop, top-weighted** — handles portrait, landscape, and off-center photos without asking the user to pre-crop, per the requirement.

---

## 6. Caching & Edge Delivery

- `/i/:id.png` served from **R2 with `Cache-Control: public, max-age=31536000, immutable`** — ids are unique per generation, so this is always safe to cache forever at the edge.
- `/c/:id` (the OG HTML page) cached at the edge for a short TTL (e.g. 5 min) — long enough to survive X's crawler retry behavior, short enough that a fixed bug doesn't stay cached.
- Frontend static assets on Cloudflare Pages are edge-cached globally by default — no configuration needed.

---

## 7. Why This Beats a Traditional Node Server Design

| Concern | Node on Render/Railway | This design (Workers + R2 + Pages) |
|---|---|---|
| Cold start | 300ms–2s on free/hobby tiers | ~0ms (V8 isolates, always warm) |
| Geographic latency | Single region (e.g. us-east) — bad for Goa-based traffic | Runs at 300+ edge locations, nearest PoP always |
| Image storage egress cost | S3 egress fees add up | R2 has **zero egress fees** |
| Ops overhead | Server to provision, monitor, scale | Fully managed, scales to zero |
| Cost at hackathon scale | Free tier likely to cold-start under load | Workers free tier: 100k req/day, no cold starts |

---

## 8. Mobile-Specific Optimizations

- Serve an **AVIF/WebP** version of the frame/badge overlay assets with PNG fallback — smaller payload on first load.
- Use `<input type="file" accept="image/*" capture="environment">` so mobile users can shoot directly from camera without a file-picker detour.
- Lazy-load the Format B (ID card) code path only when that tab is opened — keeps the default Format A bundle minimal.
- `navigator.share({ files })` attempted first on mobile (true native share sheet, image attached directly); tweet-intent URL as the universal fallback for desktop/unsupported browsers.

---

## 9. Build Order (revised for this stack)

1. **Day 1:** Cloudflare Pages + Vite scaffold; client-side upload → downscale → canvas composite → download, working end-to-end for Format A.
2. **Day 1–2:** Cloudflare Worker: `/generate` (Photon composite), R2 storage, KV metadata, `/c/:id` OG page, `/i/:id.png`.
3. **Day 2:** Wire share flow — tweet intent + `navigator.share` fallback; validate OG unfurl with X's card validator.
4. **Day 3:** Format B (ID card) — form fields, text layer, builder-title generator, lazy-loaded module.
5. **Day 3–4:** Brand assets (2–3 frame variants), HEIC edge cases, real-device testing (iOS Safari + Android Chrome).
6. **Day 4:** Final deploy, smoke test, submit form + X post with `#FrameInGoa`.

---

## 10. Key Risks to De-risk Early

- **HEIC decode in-browser** — test `heic2any` WASM bundle size and decode time on a real iPhone photo on Day 1; keep the Worker fallback ready in case client decode fails on older iOS Safari versions.
- **OG crawler caching** — X caches per-URL aggressively; unique ids per generation avoid stale-preview issues, but test with X's card validator before final submission, not after.
- **Photon/WASM compositing parity** — verify the server-rendered (Worker) composite visually matches the client-rendered one closely enough that "download" and "shared link preview" don't look like two different products.
