import { NextRequest } from 'next/server';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// firebase-admin needs the Node.js runtime (not Edge); never prerender.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Config ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.EMBED_ALLOWED_ORIGIN || 'https://aspirant-arcade-fwa8.vercel.app';
const FORCED_MODEL = 'gemini-3.1-flash-lite';
const QUOTA_LIMIT = 1;                       // generations allowed per IP…
const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000; // …per rolling 24h window
const QUOTA_COLLECTION = 'embed_quota';

// ── Firebase Admin (singleton) ───────────────────────────────────────────────
function adminApp(): App {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  const svc = JSON.parse(raw);
  // Vercel escapes newlines in env values — restore them in the private key.
  if (svc.private_key) svc.private_key = svc.private_key.replace(/\\n/g, '\n');
  return initializeApp({ credential: cert(svc) });
}

// ── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

// ── Quota check (rolling window, atomic via transaction) ─────────────────────
async function checkAndConsumeQuota(ip: string): Promise<boolean> {
  const db = getFirestore(adminApp());
  const key = ip.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 200) || 'unknown';
  const ref = db.collection(QUOTA_COLLECTION).doc(key);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? (snap.data() as { count: number; windowStart: number }) : null;

    if (data && now - data.windowStart < QUOTA_WINDOW_MS) {
      if (data.count >= QUOTA_LIMIT) return false; // exhausted
      tx.update(ref, { count: data.count + 1, lastAt: now });
    } else {
      // New IP or expired window → reset.
      tx.set(ref, { count: 1, windowStart: now, lastAt: now });
    }
    return true;
  });
}

// ── Gemini call (server-side key) ────────────────────────────────────────────
async function callGemini(prompt: string, useSchema: boolean, schema?: object): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY env var is not set');

  const body: Record<string, unknown> = { contents: [{ parts: [{ text: prompt }] }] };
  if (useSchema && schema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema: schema };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${FORCED_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API error');
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content returned from Gemini');
  return text;
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // Only the embed app may call this proxy.
  if (origin !== ALLOWED_ORIGIN) {
    return Response.json({ error: 'forbidden' }, { status: 403, headers });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  let payload: { prompt?: string; useSchema?: boolean; schema?: object };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400, headers });
  }
  if (!payload.prompt) {
    return Response.json({ error: 'missing prompt' }, { status: 400, headers });
  }

  // Enforce per-IP quota before spending any tokens.
  let allowed: boolean;
  try {
    allowed = await checkAndConsumeQuota(ip);
  } catch (e) {
    console.error('[gemini-proxy] rate-limit store unavailable:', e);
    return Response.json({ error: 'demo temporarily unavailable' }, { status: 503, headers });
  }
  if (!allowed) {
    return Response.json({ error: 'quota exceeded' }, { status: 429, headers });
  }

  try {
    const text = await callGemini(payload.prompt, !!payload.useSchema, payload.schema);
    return Response.json({ text }, { status: 200, headers });
  } catch (e) {
    console.error('[gemini-proxy] generation failed:', e);
    return Response.json({ error: (e as Error).message }, { status: 502, headers });
  }
}
