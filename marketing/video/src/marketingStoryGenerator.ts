/* eslint-disable no-console */
/**
 * Automated Marketing Story Generator for Aspirant Arcade Reels.
 *
 * Takes an aspirant pain point (or auto-rotates across themes like Exam Anxiety,
 * Doomscrolling, Formula Forgetting, Mock Test Burnout) and generates a natural,
 * bantered conversational story between Arjun & Priya.
 *
 * Uses Gemini (rotating GEMINI_API_KEYS) for creative script writing,
 * falls back to curated exam stories when keys are offline/unset,
 * and synthesizes Hindi voices:
 *   - Arjun: hi-IN-MadhurNeural (Male, relatable, ambitious)
 *   - Priya: hi-IN-SwaraNeural (Female, smart, encouraging mentor)
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { EdgeTTS } from 'node-edge-tts';
import { parseFile } from 'music-metadata';
import type { StoryPromoProps } from './StoryPromo';

const NARRATION_DIR = path.join(process.cwd(), 'public', 'audio', 'narration');

export interface GeneratedStoryResult {
  featureId: string;
  featureBadge: string;
  storyProps: StoryPromoProps;
  caption: string;
  hashtags: string[];
  youtubeTitle: string;
  youtubeDescription: string;
}

export const CURATED_STORIES = [
  {
    theme: 'exam-anxiety-games',
    featureId: 'arcade-games',
    featureBadge: '🎮 10+ ARCADE GAMES',
    dialogues: {
      scene1Priya: 'Arjun, tu abhi tak padh kyun nahi raha?',
      scene1Arjun: 'Yaar exam ki itni anxiety ho rahi hai ki book kholne ka man hi nahi kar raha... jabki padhna chahta hoon!',
      scene2Priya: 'Toh tension chhod aur Aspirant Arcade pe games khel! Yahan 10 se zyada interactive games hain jo boring syllabus ko bhi super easy bana dete hain!',
      scene3Arjun: 'Arrey waah! Formula Master aur Speed Battle jeet gaya... aur concepts bhi bina tension ke yaad ho gaye!',
    },
    outro: {
      headlineMain: 'PLAY GAMES.',
      headlineSub: 'CRACK EXAMS.',
      tagline: '10+ Gamified Arcade Modes for GATE, ESE & PSU Aspirants.',
      ctaButton: 'DOWNLOAD ASPIRANT ARCADE APP • PLAY STORE',
    },
    caption: `Arjun: "Yaar exam ki itni anxiety ho rahi hai ki book kholne ka man hi nahi kar raha..." 🤦‍♂️\nPriya: "Toh tension chhod aur Aspirant Arcade pe games khel!" 🎮\n\nFacing exam anxiety & syllabus overwhelm? Turn your stress into high scores with 10+ gamified learning modes on Aspirant Arcade!\n\n🕹️ Formula Master • Speed Arena • Boss Battles\n📲 Download Aspirant Arcade on Google Play Store (Link in bio!)\n🌐 Free online practice at https://aspirant-arcade.xyz`,
    hashtags: ['#AspirantArcade', '#ExamAnxiety', '#GamifiedLearning', '#GATE2026', '#EngineeringLife', '#StudyMotivation', '#StopProcrastinating'],
    youtubeTitle: 'Exam Anxiety se padhai nahi ho rahi? 🎮 Try Aspirant Arcade Games! #Shorts',
    youtubeDescription: 'Turn exam stress into scores. Practice GATE & PSU questions with 10+ gamified learning modes.\n\nPlay Store: https://play.google.com/store/apps/details?id=xyz.aspirant_arcade.app\n\n#Shorts #GATE2026 #StudyMotivation',
  },
  {
    theme: 'doomscrolling-focus-guard',
    featureId: 'focus-guard',
    featureBadge: '🛡️ FOCUS GUARD ACTIVE',
    dialogues: {
      scene1Priya: 'Arjun, raat ke 2 baje bhi screen scroll kar raha hai?',
      scene1Arjun: 'Bhai sach bata... phone sirf 5 MINUTE ke liye uthaya tha, aur 2 ghante se swipe kar raha hoon!',
      scene2Priya: 'Aur kal subah regret hoga! Focus Guard on kar na — har 3 reel ke baad ek GATE question screen block karega!',
      scene3Arjun: 'Arrey waah! Sahi answer diya tabhi scroll hua! Matlab DOOMSCROLLING BAND aur score chalu!',
    },
    outro: {
      headlineMain: 'STOP SCROLLING.',
      headlineSub: 'START SCORING.',
      tagline: 'Beat reel addiction with real GATE & PSU questions.',
      ctaButton: 'DOWNLOAD ASPIRANT ARCADE APP • PLAY STORE',
    },
    caption: `📱 5 minute bolke 2 ghante doomscroll kar rahe ho? 🤦‍♂️\n\nMeet Focus Guard on Aspirant Arcade! Every time you open Instagram or YouTube, an exam-realistic question pauses your scroll.\n\n🎯 Beat reel addiction. Start scoring.\n📲 Download Aspirant Arcade on Google Play Store!\n🌐 https://aspirant-arcade.xyz`,
    hashtags: ['#AspirantArcade', '#FocusGuard', '#StopDoomscrolling', '#GATE2026', '#PSUJobs', '#StudyHacks'],
    youtubeTitle: 'Phone 5 min ke liye uthaya aur 2 ghante gaye? 📱 Focus Guard is Here! #Shorts',
    youtubeDescription: 'Pause doomscrolling with real GATE & PSU questions on Aspirant Arcade.\n\n#Shorts #GATE2026 #AspirantArcade',
  },
];

const STORY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    featureBadge: { type: 'STRING' },
    scene1Priya: { type: 'STRING' },
    scene1Arjun: { type: 'STRING' },
    scene2Priya: { type: 'STRING' },
    scene3Arjun: { type: 'STRING' },
    outroMain: { type: 'STRING' },
    outroSub: { type: 'STRING' },
    outroTagline: { type: 'STRING' },
    instagramCaption: { type: 'STRING' },
    hashtags: { type: 'ARRAY', items: { type: 'STRING' } },
    youtubeTitle: { type: 'STRING' },
    youtubeDescription: { type: 'STRING' },
  },
  required: [
    'featureBadge',
    'scene1Priya',
    'scene1Arjun',
    'scene2Priya',
    'scene3Arjun',
    'outroMain',
    'outroSub',
    'outroTagline',
    'instagramCaption',
    'hashtags',
  ],
};

async function synthesizeVoiceClip(text: string, voice: string, filename: string): Promise<{ src: string; durationFrames: number }> {
  mkdirSync(NARRATION_DIR, { recursive: true });
  const outFile = path.join(NARRATION_DIR, filename);

  // Try python -m edge_tts first (uses latest edge-tts 7.3.1 with active MS token)
  try {
    const res = spawnSync('python', [
      '-m',
      'edge_tts',
      '--voice',
      voice,
      '--text',
      text,
      '--rate',
      '+6%',
      '--write-media',
      outFile,
    ]);
    if (res.status !== 0) {
      throw new Error(`edge_tts error: ${res.stderr?.toString()}`);
    }
  } catch (err) {
    // Fallback to node-edge-tts
    const tts = new EdgeTTS({
      voice,
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate: '+6%',
      timeout: 15_000,
    });
    await tts.ttsPromise(text, outFile);
  }

  const meta = await parseFile(outFile);
  const durationSec = meta.format.duration || 3.0;
  const durationFrames = Math.round(durationSec * 30);

  return {
    src: `audio/narration/${filename}`,
    durationFrames,
  };
}

/** Calls Gemini (with rotating key ring) to generate a custom 4-beat Hinglish marketing story */
async function callGeminiForStory(customPrompt: string): Promise<any | null> {
  const keys = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `You are the lead marketing director for "Aspirant Arcade" (an Indian exam prep app for GATE, PSU, Engineering, and Competitive exams).
Write a high-converting, 30-40 second 3D video reel script based on this user brief:
"${customPrompt}"

Characters:
- Priya: Friendly, smart, confident female study mentor who calls out bad study habits and suggests Aspirant Arcade features.
- Arjun: Relatable, ambitious male engineering aspirant who deals with stress, exam anxiety, distraction, but wants to win.

Format & Structure (Must be conversational casual Hinglish in Devanagari or Latin script, snappy and witty):
1. scene1Priya: Priya asks a sharp question (e.g., "Arjun, tu abhi tak padh kyun nahi raha?")
2. scene1Arjun: Arjun explains his relatable struggle (e.g., "Yaar exam anxiety ho rahi hai... book kholne ka darr lagta hai!")
3. scene2Priya: Priya introduces the Aspirant Arcade solution (e.g. 10+ interactive arcade games, Focus Guard, Speed Arena, etc.)
4. scene3Arjun: Arjun celebrates success (e.g. "Arrey waah! Formula Master jeet gaya aur concepts bhi yaad ho gaye!")
5. outroMain: Short 2-3 word punchy punchline (e.g. "PLAY GAMES.")
6. outroSub: Counter punchline (e.g. "CRACK EXAMS.")
7. outroTagline: 1-sentence value proposition.
8. instagramCaption: Engaging caption with emojis and call to action.
9. hashtags: 6-8 viral hashtags (#AspirantArcade, #GATE2026, etc.)
10. youtubeTitle: Catchy YouTube Shorts title.
11. youtubeDescription: Short description with app link.`;

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: STORY_SCHEMA },
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.status === 429) continue;
      const data = (await res.json().catch(() => ({}))) as any;
      if (data.error) continue;

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return JSON.parse(text);
    } catch (e) {
      console.warn(`[story-gen] Gemini call attempt error: ${(e as Error).message}`);
    }
  }

  return null;
}

export async function generateMarketingStory(customPrompt?: string): Promise<GeneratedStoryResult> {
  console.log('\n======================================================');
  console.log(`🧠 Generating Marketing Story...`);
  if (customPrompt) console.log(`Prompt: "${customPrompt}"`);
  console.log('======================================================\n');

  let storyData: any = null;

  if (customPrompt && customPrompt.trim()) {
    storyData = await callGeminiForStory(customPrompt);
  }

  // If Gemini was offline or no custom prompt, pick from curated stories
  if (!storyData) {
    const isAnxietyMatch = customPrompt && /anxi|stress|game|play|relax|easy/i.test(customPrompt);
    const selectedCurated = isAnxietyMatch ? CURATED_STORIES[0] : CURATED_STORIES[0];

    storyData = {
      featureBadge: selectedCurated.featureBadge,
      scene1Priya: selectedCurated.dialogues.scene1Priya,
      scene1Arjun: selectedCurated.dialogues.scene1Arjun,
      scene2Priya: selectedCurated.dialogues.scene2Priya,
      scene3Arjun: selectedCurated.dialogues.scene3Arjun,
      outroMain: selectedCurated.outro.headlineMain,
      outroSub: selectedCurated.outro.headlineSub,
      outroTagline: selectedCurated.outro.tagline,
      instagramCaption: selectedCurated.caption,
      hashtags: selectedCurated.hashtags,
      youtubeTitle: selectedCurated.youtubeTitle,
      youtubeDescription: selectedCurated.youtubeDescription,
    };
  }

  // Synthesize Hindi voices:
  // Priya = hi-IN-SwaraNeural (Female)
  // Arjun = hi-IN-MadhurNeural (Male)
  console.log('[story-gen] 🎙️ Synthesizing dynamic Hindi dialogue audio...');

  const clipPrefix = `story_${Date.now()}`;
  const priyaVoice = 'hi-IN-SwaraNeural';
  const arjunVoice = 'hi-IN-MadhurNeural';

  const clip1Priya = await synthesizeVoiceClip(storyData.scene1Priya, priyaVoice, `${clipPrefix}_1_priya.mp3`);
  const clip1Arjun = await synthesizeVoiceClip(storyData.scene1Arjun, arjunVoice, `${clipPrefix}_2_arjun.mp3`);
  const clip2Priya = await synthesizeVoiceClip(storyData.scene2Priya, priyaVoice, `${clipPrefix}_3_priya.mp3`);
  const clip3Arjun = await synthesizeVoiceClip(storyData.scene3Arjun, arjunVoice, `${clipPrefix}_4_arjun.mp3`);

  const storyProps: StoryPromoProps = {
    hasBgm: true,
    featureTag: storyData.featureBadge.replace(/^[^\w]+/, '').trim(),
    scene1Priya: {
      hindi: storyData.scene1Priya,
      audioSrc: clip1Priya.src,
      durationFrames: clip1Priya.durationFrames,
    },
    scene1Arjun: {
      hindi: storyData.scene1Arjun,
      audioSrc: clip1Arjun.src,
      durationFrames: clip1Arjun.durationFrames,
    },
    scene2Priya: {
      hindi: storyData.scene2Priya,
      audioSrc: clip2Priya.src,
      durationFrames: clip2Priya.durationFrames,
    },
    scene3Arjun: {
      hindi: storyData.scene3Arjun,
      audioSrc: clip3Arjun.src,
      durationFrames: clip3Arjun.durationFrames,
    },
    outro: {
      headlineMain: storyData.outroMain,
      headlineSub: storyData.outroSub,
      tagline: storyData.outroTagline,
      ctaButton: 'DOWNLOAD ASPIRANT ARCADE APP • PLAY STORE',
    },
  };

  return {
    featureId: 'arcade-games',
    featureBadge: storyData.featureBadge,
    storyProps,
    caption: storyData.instagramCaption,
    hashtags: storyData.hashtags,
    youtubeTitle: storyData.youtubeTitle,
    youtubeDescription: storyData.youtubeDescription,
  };
}
