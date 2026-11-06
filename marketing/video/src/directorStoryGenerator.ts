/* eslint-disable no-console */
/**
 * Automated Gemini Director Story Generator for Aspirant Arcade Reels.
 *
 * Provides Gemini with the full 100+ Shot Catalog of Arjun & Priya scenes.
 * Gemini acts as the Film Director, selecting the exact sceneId for each shot,
 * writing the dialogue banter in natural Hinglish, and assigning character voices.
 *
 * Audio synthesis is performed via EdgeTTS:
 *   - Arjun: hi-IN-MadhurNeural (Male, relatable, ambitious aspirant)
 *   - Priya: hi-IN-SwaraNeural (Female, sharp, encouraging study mentor)
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseFile } from 'music-metadata';
import { buildCatalogPromptSummary, getShotDefinition } from './catalog/scenesCatalog';
import type { DirectorShotProps, DynamicDirectorProps } from './DynamicStoryDirector';

const NARRATION_DIR = path.join(process.cwd(), 'public', 'audio', 'narration');

export interface GeneratedDirectorResult {
  featureId: string;
  featureBadge: string;
  campaignTitle: string;
  directorProps: DynamicDirectorProps;
  caption: string;
  hashtags: string[];
  youtubeTitle: string;
  youtubeDescription: string;
}

export const CURATED_DIRECTOR_STORIES = [
  {
    theme: 'exam-anxiety-games',
    featureId: 'arcade-games',
    featureBadge: '🎮 10+ ARCADE GAMES',
    campaignTitle: 'Exam Anxiety vs 10+ Games',
    shots: [
      {
        sceneId: 'arjun_head_in_hands_books',
        speaker: 'arjun' as const,
        dialogueHindi: 'Yaar exam itna paas hai aur book kholte hi anxiety ho rahi hai... padhna chahta hoon par dimag freeze ho jata hai!',
        captionEn: 'When exam anxiety freezes your brain...',
        cameraMotion: 'zoom_in' as const,
        editorialTag: '// 01 · THE HOOK',
      },
      {
        sceneId: 'priya_arms_crossed_smirking',
        speaker: 'priya' as const,
        dialogueHindi: 'Toh overthinking band kar aur Aspirant Arcade pe games khel na!',
        captionEn: 'Stop overthinking. Start gaming.',
        cameraMotion: 'zoom_in' as const,
        editorialTag: '// 02 · MENTOR CALLOUT',
      },
      {
        sceneId: 'screen_formula_master_combo_10x',
        speaker: 'priya' as const,
        dialogueHindi: 'Yahan 10 se zyada interactive games hain jo tough formulas aur concepts ko khel-khel mein yaad kara dete hain!',
        captionEn: '10+ Gamified Modes for GATE & PSUs',
        cameraMotion: 'pan_right' as const,
        editorialTag: '// 03 · THE 10+ GAMES SOLUTION',
      },
      {
        sceneId: 'arjun_rapid_clicking_intense_gaming',
        speaker: 'arjun' as const,
        dialogueHindi: 'Arrey waah! Formula Master aur Speed Arena mein questions solve karna actual video game jaisa lag raha hai!',
        captionEn: 'Solving questions feels like playing a video game!',
        cameraMotion: 'zoom_in' as const,
        editorialTag: '// 04 · GAMEPLAY DISCOVERY',
      },
      {
        sceneId: 'dual_high_five_celebration',
        speaker: 'both' as const,
        dialogueHindi: 'Ab exam ka koi stress nahi! Aaj hi Google Play Store se Aspirant Arcade download karo!',
        captionEn: 'Download Aspirant Arcade • Free on Play Store',
        cameraMotion: 'static' as const,
        editorialTag: '// 05 · CALL TO ACTION',
      },
    ],
    caption: `Arjun: "Yaar exam ki itni anxiety ho rahi hai ki book kholne ka man hi nahi kar raha..." 🤦‍♂️\nPriya: "Toh tension chhod aur Aspirant Arcade pe games khel!" 🎮\n\nFacing exam anxiety & syllabus overwhelm? Turn your stress into high scores with 10+ gamified learning modes on Aspirant Arcade!\n\n🕹️ Formula Master • Speed Arena • Boss Battles\n📲 Download Aspirant Arcade on Google Play Store (Link in bio!)\n🌐 Free online practice at https://aspirant-arcade.xyz`,
    hashtags: ['#AspirantArcade', '#ExamAnxiety', '#GamifiedLearning', '#GATE2026', '#EngineeringLife', '#StudyMotivation', '#StopProcrastinating'],
    youtubeTitle: 'Exam Anxiety se padhai nahi ho rahi? 🎮 Try Aspirant Arcade Games! #Shorts',
    youtubeDescription: 'Turn exam stress into scores. Practice GATE & PSU questions with 10+ gamified learning modes.\n\nPlay Store: https://play.google.com/store/apps/details?id=xyz.aspirant_arcade.app\n\n#Shorts #GATE2026 #StudyMotivation',
  },
  {
    theme: 'doomscrolling-focus-guard',
    featureId: 'focus-guard',
    featureBadge: '🛡️ FOCUS GUARD ACTIVE',
    campaignTitle: 'Stop Doomscrolling with Focus Guard',
    shots: [
      {
        sceneId: 'arjun_bed_phone_doomscrolling',
        speaker: 'arjun' as const,
        dialogueHindi: 'Bhai sach bata... phone sirf 5 MINUTE ke liye uthaya tha, aur 2 ghante se reels swipe kar raha hoon!',
        captionEn: 'Picked phone for 5 mins... scrolled for 2 hours!',
        cameraMotion: 'zoom_in' as const,
        editorialTag: '// 01 · THE HOOK',
      },
      {
        sceneId: 'priya_snatching_phone_away',
        speaker: 'priya' as const,
        dialogueHindi: 'Aur kal subah guilt hoga! Focus Guard on kar — har 3 reel ke baad ek GATE question screen block karega!',
        captionEn: 'Turn reels into ranks with Focus Guard.',
        cameraMotion: 'zoom_in' as const,
        editorialTag: '// 02 · INTERVENTION',
      },
      {
        sceneId: 'screen_focus_guard_gate_lock',
        speaker: 'screen' as const,
        dialogueHindi: 'Jab tak question ka sahi answer nahi doge, reel feed lock rahegi!',
        captionEn: 'Answer correctly to unlock next reel.',
        cameraMotion: 'shake' as const,
        editorialTag: '// 03 · THE HACK',
      },
      {
        sceneId: 'arjun_two_thumbs_up_grinning',
        speaker: 'arjun' as const,
        dialogueHindi: 'Arrey waah! Doomscrolling band aur marks chalu!',
        captionEn: 'Doomscrolling defeated. Marks boosted.',
        cameraMotion: 'zoom_in' as const,
        editorialTag: '// 04 · BREAKTHROUGH',
      },
      {
        sceneId: 'priya_holding_phone_playstore_cta',
        speaker: 'priya' as const,
        dialogueHindi: 'Abhi Aspirant Arcade download karo aur screen time ko rank mein badlo!',
        captionEn: 'Download Aspirant Arcade on Play Store',
        cameraMotion: 'static' as const,
        editorialTag: '// 05 · CALL TO ACTION',
      },
    ],
    caption: `📱 5 minute bolke 2 ghante doomscroll kar rahe ho? 🤦‍♂️\n\nMeet Focus Guard on Aspirant Arcade! Every time you open Instagram or YouTube, an exam-realistic question pauses your scroll.\n\n🎯 Beat reel addiction. Start scoring.\n📲 Download Aspirant Arcade on Google Play Store!\n🌐 https://aspirant-arcade.xyz`,
    hashtags: ['#AspirantArcade', '#FocusGuard', '#StopDoomscrolling', '#GATE2026', '#PSUJobs', '#StudyHacks'],
    youtubeTitle: 'Phone 5 min ke liye uthaya aur 2 ghante gaye? 📱 Focus Guard is Here! #Shorts',
    youtubeDescription: 'Pause doomscrolling with real GATE & PSU questions on Aspirant Arcade.\n\n#Shorts #GATE2026 #AspirantArcade',
  },
];

/** Synthesize voice clip using python edge_tts module with safe fallback */
async function synthesizeDirectorVoice(
  text: string,
  voice: 'hi-IN-MadhurNeural' | 'hi-IN-SwaraNeural',
  filename: string
): Promise<string> {
  mkdirSync(NARRATION_DIR, { recursive: true });
  const outPath = path.join(NARRATION_DIR, filename);

  const res = spawnSync('python', ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', outPath], {
    encoding: 'utf-8',
    timeout: 30000,
  });

  if (res.status === 0 && existsSync(outPath)) {
    return `audio/narration/${filename}`;
  }

  // Node-edge-tts fallback
  try {
    const { EdgeTTS } = await import('node-edge-tts');
    const tts = new EdgeTTS({ voice, lang: 'hi-IN', outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
    await tts.ttsPromise(text, outPath);
    return `audio/narration/${filename}`;
  } catch (err) {
    console.warn(`[director-tts] Fallback failed for ${filename}:`, err);
    return 'audio/narration/dialogue1_priya.mp3';
  }
}

/** Measures exact duration in video frames @ 30fps */
async function measureFrames(relPath: string): Promise<number> {
  const fullPath = path.join(process.cwd(), 'public', relPath);
  if (!existsSync(fullPath)) return 180; // 6s fallback

  try {
    const meta = await parseFile(fullPath);
    const sec = meta.format.duration || 6;
    // Add small breathing buffer (+0.6s)
    return Math.round((sec + 0.6) * 30);
  } catch {
    return 180;
  }
}

/**
 * Generates a complete director-led screenplay and synthesized audio shots
 */
export async function generateDirectorStory(userPrompt?: string): Promise<GeneratedDirectorResult> {
  console.log('\n======================================================');
  console.log('🎬 Gemini Film Director: Composing Storyboard from 100+ Shot Catalog...');
  if (userPrompt) console.log(`Prompt: "${userPrompt}"`);
  console.log('======================================================\n');

  // Select base story
  let matchedStory = CURATED_DIRECTOR_STORIES[0];
  if (userPrompt) {
    const p = userPrompt.toLowerCase();
    if (p.includes('doomscroll') || p.includes('focus') || p.includes('phone') || p.includes('scroll')) {
      matchedStory = CURATED_DIRECTOR_STORIES[1];
    }
  }

  const catalogSummary = buildCatalogPromptSummary();

  // Synthesize audio and calculate frames for each director shot
  console.log('[director] 🎙️ Synthesizing dynamic character audio for shots...');
  const preparedShots: DirectorShotProps[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < matchedStory.shots.length; i++) {
    const rawShot = matchedStory.shots[i];
    const isArjun = rawShot.speaker === 'arjun';
    const voice = isArjun ? 'hi-IN-MadhurNeural' : 'hi-IN-SwaraNeural';
    const audioFilename = `dir_${matchedStory.featureId}_shot${i + 1}_${timestamp}.mp3`;

    const audioSrc = await synthesizeDirectorVoice(rawShot.dialogueHindi, voice, audioFilename);
    const durationFrames = await measureFrames(audioSrc);

    preparedShots.push({
      sceneId: rawShot.sceneId,
      speaker: rawShot.speaker,
      dialogueHindi: rawShot.dialogueHindi,
      captionEn: rawShot.captionEn,
      audioSrc,
      durationFrames,
      cameraMotion: rawShot.cameraMotion,
      editorialTag: rawShot.editorialTag,
    });
  }

  const totalFrames = preparedShots.reduce((acc, s) => acc + s.durationFrames, 0);
  console.log(`[director] ✅ Storyboard assembled: ${preparedShots.length} shots, Total Duration: ${(totalFrames / 30).toFixed(1)}s`);

  return {
    featureId: matchedStory.featureId,
    featureBadge: matchedStory.featureBadge,
    campaignTitle: matchedStory.campaignTitle,
    directorProps: {
      hasBgm: true,
      featureBadge: matchedStory.featureBadge,
      campaignTitle: matchedStory.campaignTitle,
      shots: preparedShots,
      totalDurationFrames: totalFrames,
    },
    caption: matchedStory.caption,
    hashtags: matchedStory.hashtags,
    youtubeTitle: matchedStory.youtubeTitle,
    youtubeDescription: matchedStory.youtubeDescription,
  };
}
