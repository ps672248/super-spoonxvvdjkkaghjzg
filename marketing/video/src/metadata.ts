import type { ArticleVideoMeta, Vertical } from './fetchContent';
import type { Beat } from './NewsRecap';
import type { QuizVideoContent } from './quizContent';

// Fixed per-vertical hashtag sets — deterministic, not Gemini-generated per upload,
// so tagging doesn't drift into spam-looking territory run over run. Exported
// because analyticsReport.ts reverse-matches these against video descriptions
// to attribute each published video back to its vertical.
export const VERTICAL_HASHTAGS: Record<Vertical, string[]> = {
  engineering: ['#GATE2026', '#PSU', '#GATEexam', '#PSUjobs'],
  entrance: ['#JEE2026', '#NEET2026', '#CUET', '#BITSAT'],
  govt: ['#SSC2026', '#IBPS', '#SSCCGL', '#GovtJobs'],
  college: ['#BCA', '#MCA', '#MBBS', '#NursingExam'],
  schooling: ['#CBSE', '#Class10', '#Class12', '#Boards2026'],
};

const VERTICAL_KEYWORDS: Record<Vertical, string[]> = {
  engineering: ['gate exam', 'psu recruitment', 'engineering jobs india'],
  entrance: ['jee main', 'neet', 'cuet', 'bitsat'],
  govt: ['ssc cgl', 'ibps po', 'sbi po', 'govt job preparation'],
  college: ['bca', 'mca', 'mbbs', 'nursing exam'],
  schooling: ['cbse class 10', 'cbse class 12', 'board exam preparation'],
};

const BRAND_HASHTAGS = ['#AspirantArcade', '#FreeMCQ', '#ExamPrep'];
const BRAND_KEYWORDS = ['aspirant arcade', 'free mcq practice', 'exam prep app'];

/**
 * Format markers — how analyticsReport.ts tells a quiz reel from a news recap
 * from a meme. It already reverse-matches VERTICAL_HASHTAGS against descriptions
 * to attribute a vertical; without these it can't split by format at all.
 *
 * Deliberately written as literals by our own code and NEVER sourced from a
 * Gemini/model response — one hallucinated marker and per-format attribution
 * silently rots with no error anywhere. Checked: none of these three shares a
 * substring with any of the 20 strings in VERTICAL_HASHTAGS, so adding them
 * can't confuse detectVertical().
 */
export const FORMAT_MARKER = {
  quiz: '#AAquiz',
  news: '#AAnews',
  meme: '#AAmeme',
} as const;

const WEBSITE_URL = 'https://aspirant-arcade.xyz';
const TELEGRAM_URL = 'https://t.me/+k3ITt2cgZKM4N2Y1';
const YOUTUBE_URL= 'https://www.youtube.com/@aspirant-arcade'
const INSTAGRAM_URL='https://www.instagram.com/aspirant_arcade783?igsh=Znprem83Njd1OHhn'

/** Fixed brand pitch — deliberately identical on every upload so repeat viewers
 * start recognizing it (a Gemini-varied pitch would defeat the point). Feature
 * claims mirror the website's own copy (website/app/page.tsx + FaqSection.tsx);
 * if those features change, update both places. */
const BRAND_LINES = [
  '🎯 Aspirant Arcade — free gamified exam prep for GATE, PSU, JEE, NEET, SSC & boards. No login, no ads.',
  '📵 Focus Mode (Android): catches you on Reels/Shorts and makes you clear a few MCQs before you keep scrolling.',
  '⚔️ Challenge Mode: live multiplayer lobbies for up to 10 friends — share a code, duel in real time.',
];

/** Brand pitch + link block appended to every YouTube description and Instagram
 * caption, right after the (Gemini or deterministic) copy and before the hashtags.
 *
 * `platform` only changes the full-story line: Instagram strips links, so a bare
 * URL there isn't tappable and the bio link is the only route — saying so is the
 * difference between a CTA that works and one that just looks like it does. */
function linkBlock(blogUrl?: string, platform: 'youtube' | 'instagram' = 'youtube'): string {
  return [
    ...BRAND_LINES,
    ...(blogUrl ? [`📰 Full story: ${blogUrl}${platform === 'instagram' ? ' (link in bio)' : ''}`] : []),
    `📲 App + free practice: ${WEBSITE_URL}`,
    `💬 Telegram: ${TELEGRAM_URL}`,
    `📸 Instagram: ${INSTAGRAM_URL}`,
    `▶️ YouTube: ${YOUTUBE_URL}`,
  ].join('\n');
}

// Fallback hook pool — used on-screen (and in the title) only when the Gemini
// quiz-content call failed. Kept per-vertical so a GATE line never fronts an SSC reel.
const QUIZ_HOOKS: Record<Vertical, string[]> = {
  engineering: ['Only 1% of GATE aspirants get this', 'PSU exam level — 10 seconds ⏱️', 'GATE toppers hesitate on this one'],
  entrance: ['This one line decides your NEET rank', 'JEE aspirants keep getting this wrong', '90% of CUET takers miss this'],
  govt: ['SSC toppers solve this in 10 seconds', 'Bank PO level — can you keep up?', 'This question filters the SSC merit list'],
  college: ['Every BCA student gets this wrong', 'Semester exam classic — still tricky', 'MBBS-level recall check in 10 seconds'],
  schooling: ['Class 12 boards ask this every year', 'NCERT line 90% of students skip', 'Board exam trap question — careful'],
};

// Rotating title openers — one fixed "Can you solve this?" every day reads as spam
// to both viewers and search. Picked deterministically off the date so re-renders
// of the same day keep the same title.
const TITLE_FORMULAS = [
  'Can you solve this?',
  'Only 1% get this right —',
  '10 seconds. One question.',
  'Toppers answer this instantly:',
  'This one filters the merit list:',
];

export function quizFallbackHook(vertical: Vertical): string {
  const pool = QUIZ_HOOKS[vertical];
  return pool[new Date().getDate() % pool.length];
}

function hashtags(vertical: Vertical, extra: string[] = []): string[] {
  return [...new Set([...VERTICAL_HASHTAGS[vertical], ...extra, ...BRAND_HASHTAGS])].slice(0, 8);
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export type UploadMetadata = {
  youtube: { title: string; description: string; tags: string[] };
  instagram: { caption: string };
};

/** Prefers the Gemini quiz copy (src/quizContent.ts) when available; deterministic fallback otherwise. */
export function buildQuizMetadata(vertical: Vertical, question: string, gemini?: QuizVideoContent | null): UploadMetadata {
  const tags = hashtags(vertical);

  if (gemini?.youtubeTitle && gemini?.instagramCaption) {
    const igHashtags = (gemini.instagramHashtags?.length ? gemini.instagramHashtags : tags).slice(0, 5);
    return {
      youtube: {
        title: truncate(gemini.youtubeTitle, 95),
        description: `${gemini.youtubeDescription || question}\n\n${linkBlock()}\n\n${tags.join(' ')} ${FORMAT_MARKER.quiz}\n#Shorts`,
        tags: gemini.youtubeTags?.length ? gemini.youtubeTags : [...VERTICAL_KEYWORDS[vertical], ...BRAND_KEYWORDS],
      },
      instagram: { caption: `${gemini.instagramCaption}\n\n${linkBlock()}\n\n${igHashtags.join(' ')} ${FORMAT_MARKER.quiz}` },
    };
  }

  const hook = TITLE_FORMULAS[new Date().getDate() % TITLE_FORMULAS.length];
  const title = `${hook} ${truncate(question, 95 - hook.length - 1)}`;
  const description = [
    question,
    '',
    'Comment your answer 👇',
    '',
    linkBlock(),
    '',
    `${tags.join(' ')} ${FORMAT_MARKER.quiz}`,
  ].join('\n');

  return {
    youtube: {
      title,
      description: `${description}\n#Shorts`, // hints YouTube's Shorts classifier alongside the 9:16/<=3min signal
      tags: [...VERTICAL_KEYWORDS[vertical], ...BRAND_KEYWORDS, 'mcq', 'quiz', 'exam preparation'],
    },
    instagram: { caption: `${title}\n\n${linkBlock()}\n\n${tags.join(' ')} ${FORMAT_MARKER.quiz}` },
  };
}

/** Prefers Gemini's own news-specific upload copy (scripts/blog_bot.ts VIDEO_META_INSTRUCTION)
 * when the article has it; falls back to the fixed deterministic metadata below otherwise
 * (e.g. articles generated before this field existed, or where Gemini omitted it).
 * `blogUrl` (derived from the headline slug by renderNewsRecap.ts) lands in the link block. */
export function buildNewsMetadata(
  vertical: Vertical,
  headline: string,
  beats: Beat[],
  geminiMeta?: ArticleVideoMeta,
  blogUrl?: string,
): UploadMetadata {
  if (geminiMeta?.youtubeTitle && geminiMeta?.instagramCaption) {
    const igHashtags = (geminiMeta.instagramHashtags?.length ? geminiMeta.instagramHashtags : hashtags(vertical)).slice(0, 5);
    return {
      youtube: {
        title: truncate(geminiMeta.youtubeTitle, 95),
        description: `${geminiMeta.youtubeDescription || headline}\n\n${linkBlock(blogUrl)}\n\n${FORMAT_MARKER.news}\n#Shorts`,
        tags: geminiMeta.youtubeTags?.length ? geminiMeta.youtubeTags : [...VERTICAL_KEYWORDS[vertical], ...BRAND_KEYWORDS],
      },
      instagram: { caption: `${geminiMeta.instagramCaption}\n\n${linkBlock(blogUrl, 'instagram')}\n\n${igHashtags.join(' ')} ${FORMAT_MARKER.news}` },
    };
  }

  const tags = hashtags(vertical, ['#ExamNews']);
  const title = truncate(headline, 95);
  const beatLines = beats.map((b) => `• ${b.label}: ${b.text}`).join('\n');
  const description = [
    headline,
    '',
    beatLines,
    '',
    linkBlock(blogUrl),
    '',
    `${tags.join(' ')} ${FORMAT_MARKER.news}`,
  ].join('\n');

  return {
    youtube: {
      title,
      description: `${description}\n#Shorts`,
      tags: [...VERTICAL_KEYWORDS[vertical], ...BRAND_KEYWORDS, 'exam news', 'recruitment notification'],
    },
    instagram: { caption: `${title}\n\n${beatLines}\n\n${linkBlock(blogUrl, 'instagram')}\n\n${tags.join(' ')} ${FORMAT_MARKER.news}` },
  };
}

/**
 * Meme reels carry no Gemini-authored upload copy — the joke and the concept are
 * both inside the image, so the caption's whole job is search/discovery plus the
 * link block. Deterministic on purpose.
 *
 * `topic` is the source question, used only to derive searchable text; it is
 * deliberately NOT quoted verbatim in the title, because the meme has already
 * reframed it and repeating the raw question reads like a mismatched caption.
 */
export function buildMemeMetadata(vertical: Vertical, template: string, topic: string): UploadMetadata {
  const tags = hashtags(vertical, ['#Memes', '#ExamMemes']);
  const subject = truncate(topic.replace(/\s+/g, ' ').trim(), 70);
  const title = truncate(`${VERTICAL_TITLE_HINT[vertical]} memes that actually teach you something 😭`, 95);

  const description = [
    `If you know, you know. Today's one: ${subject}`,
    '',
    'Practice the real thing free on Aspirant Arcade 👇',
    '',
    linkBlock(),
    '',
    `${tags.join(' ')} ${FORMAT_MARKER.meme}`,
  ].join('\n');

  return {
    youtube: {
      title,
      description: `${description}\n#Shorts`,
      tags: [...VERTICAL_KEYWORDS[vertical], ...BRAND_KEYWORDS, 'exam memes', 'study memes', 'indian exam memes', template.toLowerCase()],
    },
    instagram: {
      caption: `If you know, you know 😭\n${subject}\n\n${linkBlock()}\n\n${tags.slice(0, 5).join(' ')} ${FORMAT_MARKER.meme}`,
    },
  };
}

/** Short, meme-caption-friendly name for the audience — not the formal VERTICAL_LABEL. */
const VERTICAL_TITLE_HINT: Record<Vertical, string> = {
  engineering: 'GATE/PSU aspirant',
  entrance: 'JEE/NEET aspirant',
  govt: 'SSC aspirant',
  college: 'College exam',
  schooling: 'Board exam',
};
