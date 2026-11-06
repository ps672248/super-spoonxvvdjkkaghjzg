import asyncio
import os
import edge_tts

AUDIO_DIR = os.path.join(os.getcwd(), "aspirant_arcade_public", "marketing", "video", "public", "audio", "narration")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Voices:
VOICE_ARJUN = "hi-IN-MadhurNeural" # Warm, energetic Indian Hindi male voice
VOICE_PRIYA = "hi-IN-SwaraNeural"  # Clear, smart Indian Hindi female voice
VOICE_NEWS = "hi-IN-MadhurNeural"   # Crisp news presenter voice

news_clips = [
    ("news_headline.mp3", "500+ PSU jobs just dropped! HPCL Executive Trainee 2026 Notification Released.", VOICE_NEWS),
    ("news_beat0.mp3", "Mechanical, Electrical aur Chemical branches ke liye 500 se zyada Executive Trainee vacancies aayi hain.", VOICE_NEWS),
    ("news_beat1.mp3", "Selected candidates ko lagbhag ek lakh chalees hazaar rupaye mahina starting CTC plus full PSU perks milenge.", VOICE_NEWS),
    ("news_beat2.mp3", "Eligibility ke liye 60% aggregate marks ke sath engineering degree aur valid GATE scorecard zaroori hai.", VOICE_NEWS),
    ("news_beat3.mp3", "Online application window 15 March 2026 ko close hogi, toh portal rush se bachne ke liye jaldi apply karein.", VOICE_NEWS),
    ("news_cta.mp3", "Poori branch details aur syllabus ke liye Aspirant Arcade app download karein.", VOICE_NEWS)
]

story_clips = [
    ("dialogue1_arjun.mp3", "Bhai sach bata... phone uthaya tha 5 minute ke liye, aur 2 ghante se bina ruke reels swipe kar raha hoon!", VOICE_ARJUN),
    ("dialogue2_priya.mp3", "Aur raat ko guilt karega ki aaj ka syllabus phir reh gaya! Kitni baar bola hai Aspirant Arcade ka Focus Guard laga le!", VOICE_PRIYA),
    ("dialogue3_arjun.mp3", "Lekin usse kya hoga?", VOICE_ARJUN),
    ("dialogue4_priya.mp3", "Instagram kholte hi har 3 reel ke baad ek GATE question screen block karega. Sahi answer dega tabhi scroll hoga!", VOICE_PRIYA),
    ("dialogue5_arjun.mp3", "Arrey waah! Sahi answer diya tabhi scroll hua! Matlab doomscrolling band aur score chalu!", VOICE_ARJUN),
    ("dialogue6_both.mp3", "Stop scrolling. Start scoring. Download Aspirant Arcade on Google Play Store now!", VOICE_PRIYA)
]

async def generate_file(filename, text, voice):
    out_path = os.path.join(AUDIO_DIR, filename)
    communicate = edge_tts.Communicate(text, voice, rate="+10%")
    await communicate.save(out_path)
    print(f"Generated {filename}: {os.path.getsize(out_path)} bytes")
    return filename

async def main():
    print("\n--- Generating News Audio Clips ---")
    for fname, text, voice in news_clips:
        await generate_file(fname, text, voice)

    print("\n--- Generating Dual-Character Marketing Dialogue Clips ---")
    for fname, text, voice in story_clips:
        await generate_file(fname, text, voice)

if __name__ == "__main__":
    asyncio.run(main())
