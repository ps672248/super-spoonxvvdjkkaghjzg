/**
 * Stage 1 of 2: writes the meme's TEXT before any image is generated.
 *
 * Why this exists: image models are renderers, not comedy writers. Asking
 * gpt-image-2 to invent a joke AND spell it produced exactly what you'd expect —
 * typos ("DOT BINA?", "JOH"), three captions crammed onto a one-character
 * template, and jokes that were "studying is hard" with a fact bolted on. Their
 * quoted ~98.5% text accuracy is for rendering text you HAND them.
 *
 * So the split is:
 *   memeScript.ts  — a multimodal text model LOOKS at the template and writes the
 *                    exact captions. Cheap (gemini-2.5-flash, existing key ring),
 *                    validatable, and retryable for near-zero cost.
 *   memeImage.ts   — the image model only places those exact strings. No
 *                    invention, nothing to misspell that we didn't supply.
 *
 * The writer gets the template IMAGE, not just its name — which is what finally
 * fixes the structure problem. conceptShape in the bank is Gemini-drafted prose
 * that says roughly "illustrates a misconception" for all 34 entries; it carries
 * no panel count and no speaker layout. A model that can see two men talking
 * writes two lines. A model reading that sentence writes three and hopes.
 *
 * Env: GEMINI_API_KEYS (comma-separated, rotated on quota — same secret the blog
 *      bot and quizContent.ts use), GEMINI_MEME_SCRIPT_MODEL (default
 *      gemini-2.5-flash).
 */
import type { MemeTemplate } from './memeTemplates';
import type { Vertical } from './fetchContent';
import type { MemeTopic } from './memeTopics';

export type MemePanel = {
  /** Where this line goes, in the template's own terms — "top caption",
   * "left man, speaking", "below the rat". Passed through to the render prompt. */
  where: string;
  /** The exact words to render. Nothing is reworded downstream. */
  text: string;
};

export type MemeScript = {
  /** The specific wrong belief the joke targets. Logged so `not-funny` vs
   * `wrong-concept` rejects can be told apart later without re-reading the image. */
  misconception: string;
  /** The correct fact, stated plainly in one sentence — NOT for the image.
   *
   * This is the safety net for topic-first generation. The subject is no longer a
   * pre-verified question out of question_bank, so the model supplies the fact
   * itself. Making it state that fact in plain language puts the claim on the
   * Discord card where it can be sanity-checked in two seconds, instead of being
   * buried inside a Hinglish punchline you'd have to decode first. Model knowledge
   * is solid on famous traps (series vs parallel) and thinner on niche
   * exam-specific material — this is where that shows up. */
  fact: string;
  /** One short line naming which words carry the correct answer. Forces the model
   * to check the thing it kept getting wrong — early versions produced captions
   * that only *negated* the misconception ("yahi soch ke marks gaye"), which is
   * funny-adjacent but leaves the viewer unable to learn anything. Also the most
   * useful line on the Discord approval card. */
  mechanic: string;
  panels: MemePanel[];
};

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    misconception: { type: 'STRING' },
    fact: { type: 'STRING' },
    mechanic: { type: 'STRING' },
    panels: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { where: { type: 'STRING' }, text: { type: 'STRING' } },
        required: ['where', 'text'],
      },
    },
  },
  required: ['misconception', 'fact', 'mechanic', 'panels'],
};

/**
 * Caption language per vertical. Roman script only — enforced by validation
 * below, not just requested. Image models render transliterated Hindi far better
 * than Devanagari glyphs, and a mangled Devanagari caption is unfixable at render
 * time.
 */
const LANGUAGE_RULE: Record<Vertical, string> = {
  govt: 'Roman-script Hinglish, heavy (e.g. "bhai ye toh nikal gaya"). Exam names and technical terms stay in English.',
  entrance: 'Roman-script Hinglish, heavy. Exam names, formulas and technical terms stay in English.',
  schooling: 'Roman-script Hinglish, light — mostly simple English with a few Hindi words. Clean and school-appropriate.',
  engineering: 'Roman-script Hinglish for the joke, but ALL technical vocabulary strictly in English so it stays searchable.',
  college: 'English-leaning with light Roman-script Hinglish. Technical terms in English.',
};

/** Recognisable exam-culture texture per vertical — specificity is what makes a meme shareable. */
const CULTURAL_ANCHORS: Record<Vertical, string> = {
  engineering: 'GATE score vs COAP rounds, waiting on PSU cutoffs, "interview mein yahi poocha tha", Mech vs CS rivalry, refreshing for notifications',
  govt: 'SSC CGL tier anxiety, normalisation, "one mark ka difference", prelims vs mains, family pressure about sarkari naukri',
  entrance: 'Kota, droppers, "mock mein 180 board mein 95", NEET diagram recall, JEE Advanced paper-2 despair',
  college: 'night-before-semester culture, "unit 4 aur 5 kabhi padha hi nahi", MBBS syllabus volume, practical file backlog, viva',
  schooling: 'pre-boards, NCERT line-by-line, "sample paper vs actual paper"',
};

/**
 * Worked examples of the ONE mechanic that works, plus the failure mode that
 * keeps happening. Positive exemplars do far more here than the wall of "do not"
 * rules this prompt used to be — the old version had eleven prohibitions and
 * zero examples of a good meme.
 */
const EXEMPLARS = `STUDIED EXAMPLES — copy the MECHANIC, never the content.

GOOD (two people talking, 2 slots). Topic: Arithmetic. Trap chosen: percentage points.
  misconception: "people read 2 percentage points as a 2% rise"
  fact: "A rate moving from 5% to 7% has risen by 2 percentage points, which is a 40% relative increase."
  mechanic: "right man's '40% badha' is the correct answer, delivered as a burn"
  left man, confident:  "Rate 5% se 7% hua"
  right man, deadpan:   "2% nahi badha. 40% badha."
  Why it works: the punchline IS the right answer. You learn it by watching someone
  get corrected. Nobody defined anything. 9 words.

GOOD (one smug character, 1 slot). Topic: Thermodynamics. Trap chosen: temperature units.
  misconception: "students plug in Celsius"
  fact: "Gas law calculations require absolute temperature in Kelvin; Celsius values must be converted first."
  mechanic: "'Kelvin' in the caption is the answer; the regret is the delivery"
  single caption: "27 degree daala. Kelvin maang raha tha."
  Why it works: one character, ONE line — the template's structure set the word
  count, not the concept's importance. And the fix (Kelvin) is IN the line. 6 words.

NEARLY GOOD, STILL A FAIL — this is the trap. Same gas law.
  single caption: "Gas law lagaya. Galat unit mein."
  Why it fails: it says the intuition is wrong but never says what's right. The
  viewer laughs and still cannot answer the question. **Negating the misconception
  is not teaching.** Name the right thing.

BAD. Same gas law.
  "Exam tomorrow and I still don't get thermodynamics 😭" + "Remember: always convert to Kelvin!"
  Why it fails: the joke is about exam stress and the concept is a tip stapled next
  to it — two separate things sharing a frame. If you can delete the caption and
  the joke still works, the joke is not about the concept. Start over.`;

function buildScriptPrompt(args: {
  template: MemeTemplate;
  topic: MemeTopic;
  examLabel: string;
  vertical: Vertical;
  /** Misconceptions already used on this topic, from meme_history.json. Left out
   * and the model returns its single favourite joke for the topic every time. */
  usedMisconceptions?: string[];
  retryNote?: string;
}): string {
  const { template, topic, examLabel, vertical, usedMisconceptions, retryNote } = args;

  return `You write memes for Aspirant Arcade, a free Indian gamified exam-prep app. Audience: ${examLabel} aspirants in India. You are writing the TEXT ONLY — another model draws the image.

THE TEMPLATE IS ATTACHED. Look at it before you write a single word, and answer these to yourself first:
- How many text slots does this layout NATURALLY have? A two-person conversation has two. A single reaction character has ONE. Do not invent slots the picture cannot carry — that is the single most common way these memes break.
- Who is in it, and what is each one's expression? Write in their voice.
- The template is known as "${template.name}". Editorial note from our bank (treat as a hint, the picture overrules it): ${template.conceptShape}

TODAY'S TOPIC: **${topic.title}**${topic.subtopics.length ? `\nSubtopics in our syllabus: ${topic.subtopics.join(' · ')}` : ''}

YOU CHOOSE THE TRAP. That is the most important instruction here. Do not try to cover the topic — pick the ONE thing inside it that aspirants most reliably get wrong, and build the whole meme on that. You already know which ones those are: the two things that look alike, the step everyone skips, the condition everyone forgets, the sign that flips, the unit nobody converts, the formula that only holds in a case people ignore.

Pick the trap with the most SHARED PAIN. The best meme targets a mistake almost everyone in the room has personally made — that is what gets it forwarded to a prep group. A rare edge case is not funny even if it is technically interesting. If a subtopic above has an obvious universal trap, take it.
${usedMisconceptions?.length ? `\nALREADY USED — pick a different trap in this topic:\n${usedMisconceptions.map((m) => `- ${m}`).join('\n')}` : ''}

BE CORRECT. You are supplying the fact yourself; nothing downstream verifies it. State it plainly in "fact" — one sentence, no joke, no Hinglish — so a human reviewer can check it at a glance. If you are not confident the trap you picked is genuinely correct as stated, pick a different one you are sure of.

TEACH THROUGH THE JOKE. The concept is learned BY GETTING THE JOKE. The punchline and the lesson are the same sentence.
- **THE PUNCHLINE MUST CARRY THE CORRECT ANSWER.** Not hint at it, not rule out the wrong one — contain it. "You thought it cancels out" is only half a meme; "it's a 4% loss, and here's the face you make" is the whole one. Merely confessing to the mistake teaches nothing: the reader ends up knowing their instinct was wrong and still not knowing what's right.
- Do NOT explain the concept anywhere. No definitions, no "actually…", no takeaway line. The correct answer arrives as part of the joke — a punchline, a burn, a deadpan number — never as a note beside it.
- Funny first. An unwatched lesson teaches nobody.
- The subject is always "us" (aspirants together), never "you". Never mock anyone who failed.

${EXEMPLARS}

Draw texture from real aspirant life: ${CULTURAL_ANCHORS[vertical]}.

LANGUAGE: ${LANGUAGE_RULE[vertical]} Roman/Latin script ONLY — no Devanagari characters anywhere.

HARD LIMITS (these are validated in code; violating one means your output is thrown away):
- 1 to 4 panels, matching what the template can actually carry.
- Max 22 words TOTAL across all panels. Max 10 words in any single panel.
- Never write the words QUESTION, ANSWER, EXPLANATION, TIP, NOTE, or any label like them.
- The "fact" sentence NEVER appears on the image. It is for the human reviewer only.
- Never name or imply Testbook, Adda247, Physics Wallah, Unacademy, BYJU'S, or any coaching institute.
- No political or religious content. Nothing about caste, region, reservation, paper leaks, or exam controversies.
- No Aspirant Arcade branding, URL, or watermark — the video adds its own.

LAST CHECK BEFORE YOU ANSWER — point at the exact words in your captions that give away the correct answer. If you cannot point at them, you have written a meme that only mocks the mistake, and a reader who has never studied this learns nothing from it. Rewrite it.
${retryNote ? `\nYOUR PREVIOUS ATTEMPT WAS REJECTED: ${retryNote}\nFix exactly that and return a corrected version.` : ''}

Return JSON only:
{ "misconception": one line — the wrong belief you targeted,
  "fact": one plain sentence stating what is actually true — never shown on the image,
  "mechanic": max 15 words — name the words that carry the correct answer, e.g. "'40% badha' is the answer, delivered as a burn",
  "panels": [{ "where", "text" }] in reading order }`;
}

const FORBIDDEN_LABELS = /\b(question|answer|explanation|tip|note|hint|fact|did you know)\b\s*[:\-—]/i;
const FORBIDDEN_BRANDS = /\b(testbook|adda\s*247|physics\s*wallah|pw\b|unacademy|byju'?s?|vedantu|aakash|allen)\b/i;
const DEVANAGARI = /[ऀ-ॿ]/;
const MAX_TOTAL_WORDS = 22;
const MAX_PANEL_WORDS = 10;

function words(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

/**
 * Returns a rejection reason, or null if the script is usable. Runs before any
 * image call, so a bad script costs a ~free text retry instead of $0.039 and a
 * ruined post. This is also the layer that made the image budget real — the old
 * prompt asked for "max 20 words" and nothing ever checked.
 */
export function validateScript(script: MemeScript): string | null {
  // Load-bearing under topic-first generation: `fact` is the only place the claim
  // is stated in checkable language, and it's what the Discord card shows.
  if (!script.fact?.trim()) return 'no "fact" returned — the plain claim is required for review';
  if (!Array.isArray(script.panels) || script.panels.length === 0) return 'no panels returned';
  if (script.panels.length > 4) return `${script.panels.length} panels — max 4`;

  const all = script.panels.map((p) => p.text || '').join(' ');
  if (!all.trim()) return 'all panel text was empty';

  const total = words(all).length;
  if (total > MAX_TOTAL_WORDS) return `${total} words total — hard limit is ${MAX_TOTAL_WORDS}`;

  for (const p of script.panels) {
    const n = words(p.text).length;
    if (n === 0) return 'a panel had empty text';
    if (n > MAX_PANEL_WORDS) return `a panel had ${n} words — max ${MAX_PANEL_WORDS} per panel ("${p.text}")`;
    if (!p.where?.trim()) return 'a panel was missing its "where" placement';
  }

  if (DEVANAGARI.test(all)) return 'Devanagari script used — Roman/Latin only';
  if (FORBIDDEN_LABELS.test(all)) return 'used a label like "Question:" / "Tip:" — memes have no labels';
  if (FORBIDDEN_BRANDS.test(all)) return 'named a competitor or coaching institute';

  // The plain-language claim must stay OFF the image — that's the difference
  // between a meme and an infographic with a picture behind it. Eight consecutive
  // words is long enough to be a real lift and short enough that a shared phrase
  // ("kinetic energy of the body") doesn't trip it.
  const factWords = words(script.fact.toLowerCase());
  const captionText = ` ${all.toLowerCase().replace(/[^\w\s]/g, '')} `;
  for (let i = 0; i + 8 <= factWords.length; i += 1) {
    const run = factWords.slice(i, i + 8).join(' ').replace(/[^\w\s]/g, '');
    if (run.length > 16 && captionText.includes(` ${run} `)) return `pasted the plain "fact" onto the image ("${run}")`;
  }

  return null;
}

/** Fetches the template art once. Both stages need it — the writer to see the
 * layout, the Gemini image provider to edit it — so renderMeme.ts fetches once
 * and passes the bytes down. (The Puter provider still hands over the URL and
 * lets Puter's side fetch it.)
 *
 * Retried because the bank stores URLs rather than vendored files, so this one
 * request is a hard dependency for the entire run — and memes.co.in's media host
 * is genuinely flaky (a 10-URL probe: 5 timeouts, and 322ms to 19.5s on the ones
 * that landed). The timeout is deliberately longer than feels reasonable because a
 * 19s response is a success here. renderMeme.ts falls back to the next-ranked
 * template when all three attempts fail. */
export async function fetchTemplateImage(sourceUrl: string): Promise<{ base64: string; mime: string }> {
  let lastError = 'not attempted';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const mime = res.headers.get('content-type')?.split(';')[0] || (/\.png$/i.test(sourceUrl) ? 'image/png' : 'image/jpeg');
      return { base64: Buffer.from(await res.arrayBuffer()).toString('base64'), mime };
    } catch (e) {
      lastError = (e as Error).message;
      console.warn(`[meme-bot] Template fetch attempt ${attempt}/3 failed (${lastError}).`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2_000));
    }
  }
  throw new Error(`template fetch failed after 3 attempts (${lastError}) for ${sourceUrl}`);
}

const MAX_ATTEMPTS = 3;

/**
 * Writes and validates the day's meme text. Returns null when every attempt
 * failed — renderMeme.ts then exits without rendering, matching this bucket's
 * existing no-degraded-mode contract.
 *
 * Retries feed the validation failure back in, because the failures are
 * mechanical (too many words, wrong panel count) and models fix those reliably
 * when told which one they hit.
 */
export async function writeMemeScript(args: {
  template: MemeTemplate;
  templateImage: { base64: string; mime: string };
  topic: MemeTopic;
  examLabel: string;
  vertical: Vertical;
  usedMisconceptions?: string[];
}): Promise<MemeScript | null> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.warn('[meme-bot] GEMINI_API_KEYS not set — cannot write the meme script. No meme today.');
    return null;
  }
  const model = process.env.GEMINI_MEME_SCRIPT_MODEL || 'gemini-2.5-flash';

  let retryNote: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const prompt = buildScriptPrompt({ ...args, retryNote });
    const script = await callGemini(keys, model, prompt, args.templateImage);
    if (!script) {
      retryNote = undefined; // transport failure, not a content failure — ask again clean
      continue;
    }

    const problem = validateScript(script);
    if (!problem) {
      console.log(`[meme-bot] Script (attempt ${attempt}): ${script.panels.map((p) => `[${p.where}] ${p.text}`).join('  |  ')}`);
      console.log(`[meme-bot] Trap: ${script.misconception}`);
      // Printed so a wrong claim is visible in the Actions log too, not only on
      // the Discord card.
      console.log(`[meme-bot] Fact: ${script.fact}`);
      console.log(`[meme-bot] Mechanic: ${script.mechanic}`);
      return script;
    }
    console.warn(`[meme-bot] Script attempt ${attempt} rejected — ${problem}`);
    retryNote = problem;
  }

  console.warn(`[meme-bot] No usable script after ${MAX_ATTEMPTS} attempts.`);
  return null;
}

/** One pass through the key ring, rotating on quota errors — same shape as quizContent.ts. */
async function callGemini(
  keys: string[],
  model: string,
  prompt: string,
  image: { base64: string; mime: string },
): Promise<MemeScript | null> {
  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: image.mime, data: image.base64 } }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429) continue;
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (data.error) {
        if (/quota|exhausted|rate|RESOURCE_EXHAUSTED/i.test(data.error.message || '')) continue;
        throw new Error(data.error.message || `HTTP ${res.status}`);
      }
      const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
      if (!text) continue;
      return JSON.parse(text) as MemeScript;
    } catch (e) {
      console.warn(`[meme-bot] Script Gemini call failed: ${(e as Error).message}`);
    }
  }
  return null;
}
