# Embedded Quiz Demo — Setup

The marketing site embeds the psu-plus app in an iframe (`/try`) so visitors can
run **one free AI quiz** per IP per 24h. The Gemini key lives only on the server
(this Next.js app), never in the iframe.

## Architecture

```
website (/try)  ──iframe──▶  app  ?embed=1   (aspirant-arcade-fwa8.vercel.app)
                                  │
                                  │  fetch (CORS)
                                  ▼
website /api/gemini  ──server key + flash-lite──▶  Gemini API
        │
        └── Firestore `embed_quota/{ip}`  (1 / IP / 24h rolling)
```

- Only the quiz "Prepare" flow runs in the iframe. Interview prep, settings,
  insights, bookmarks, auth → "Available on the full site" modal → Redirect/Cancel.
- Model is forced to `gemini-3.1-flash-lite` server-side (client can't change it).
- Quota exhausted → 429 → app shows the redirect modal.

## Required env vars (Vercel → website project)

| Var | Value |
|-----|-------|
| `GEMINI_API_KEY` | A Google AI Studio key. Used only server-side. Set a low daily quota cap on it in Google Cloud as a backstop. |
| `FIREBASE_SERVICE_ACCOUNT` | Full service-account JSON (one line) for project `alhansat-4edee`. Firebase Console → Project Settings → Service accounts → Generate new private key. Paste the JSON as the value. |
| `EMBED_ALLOWED_ORIGIN` | *(optional)* Defaults to `https://aspirant-arcade-fwa8.vercel.app`. The iframe app origin allowed to call the proxy. |

## Optional env var (Vercel → psu-plus project)

| Var | Value |
|-----|-------|
| `EXPO_PUBLIC_GEMINI_PROXY_URL` | Override the proxy URL. Defaults to `https://aspirant-arcade.vercel.app/api/gemini`. Set this if the website is on a different domain. |

## Notes

- The proxy uses the Firebase **Admin** SDK, which bypasses Firestore security
  rules. No rule changes needed; `embed_quota` stays inaccessible to clients.
- IP quota is keyed on `x-forwarded-for`. Shared/CGNAT IPs share the quota;
  VPN/mobile-data cycling can bypass it — acceptable since flash-lite is cheap
  and capped per IP.
