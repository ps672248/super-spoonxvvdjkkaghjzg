import asyncio
import os
import edge_tts

VOICE = "hi-IN-MadhurNeural" # Warm, energetic Indian Hindi male voice
RATE = "+10%"

scenes = [
    ("story_s1.mp3", "Bhai sach sach bata... phone uthaya tha sirf paanch minute ke liye na? Aur ab do ghante se bina ruke reels swipe kar raha hai!"),
    ("story_s2.mp3", "Aur raat ko wahi guilt hota hai ki aaj ka syllabus phir reh gaya!"),
    ("story_s3.mp3", "Isiliye Aspirant Arcade me banaya hai Focus Guard! Ab har teesri reel ke baad ek question screen block karega. Sahi answer dega tabhi aage scroll hoga!"),
    ("story_s4.mp3", "Stop scrolling. Start scoring. Download Aspirant Arcade on Google Play Store.")
]

async def main():
    target_dir = os.path.join(os.getcwd(), "aspirant_arcade_public", "marketing", "video", "public", "audio", "narration")
    os.makedirs(target_dir, exist_ok=True)
    
    for filename, text in scenes:
        out_path = os.path.join(target_dir, filename)
        print(f"Synthesizing {filename}...")
        communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
        await communicate.save(out_path)
        print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    asyncio.run(main())

