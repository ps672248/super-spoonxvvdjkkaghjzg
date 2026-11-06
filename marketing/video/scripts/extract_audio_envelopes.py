import subprocess
import os
import json
import numpy as np

VIDEO_DIR = os.path.abspath("aspirant_arcade_public/marketing/video")
AUDIO_DIR = os.path.join(VIDEO_DIR, "public", "audio", "narration")
OUT_JSON = os.path.join(VIDEO_DIR, "src", "audioEnvelopes.json")

FPS = 30
SAMPLE_RATE = 44100
SAMPLES_PER_FRAME = SAMPLE_RATE // FPS # 1470 samples per frame

clips = [
    "dialogue1_arjun.mp3",
    "dialogue2_priya.mp3",
    "dialogue3_arjun.mp3",
    "dialogue4_priya.mp3",
    "dialogue5_arjun.mp3",
    "dialogue6_both.mp3",
    "news_headline.mp3",
    "news_beat0.mp3",
    "news_beat1.mp3",
    "news_beat2.mp3",
    "news_beat3.mp3",
    "news_cta.mp3"
]

results = {}

for clip in clips:
    path = os.path.join(AUDIO_DIR, clip)
    if not os.path.exists(path):
        print(f"Skipping missing {clip}")
        continue
    
    # Extract raw float32 PCM using ffmpeg
    cmd = [
        "ffmpeg", "-y", "-i", path,
        "-f", "f32le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    raw_data, _ = proc.communicate()
    samples = np.frombuffer(raw_data, dtype=np.float32)
    
    total_frames = len(samples) // SAMPLES_PER_FRAME
    envelope = []
    
    for f in range(total_frames):
        chunk = samples[f * SAMPLES_PER_FRAME : (f + 1) * SAMPLES_PER_FRAME]
        rms = np.sqrt(np.mean(chunk**2)) if len(chunk) > 0 else 0.0
        envelope.append(float(rms))
    
    # Normalize envelope so speech peaks are around 1.0, noise floor is 0.0
    arr = np.array(envelope)
    max_val = np.percentile(arr, 98) if len(arr) > 0 else 1.0
    if max_val > 0.001:
        arr = arr / max_val
    arr = np.clip(arr, 0.0, 1.2)
    
    # Smooth slightly (3-frame moving average) to prevent harsh jitter while preserving transients
    smoothed = []
    for i in range(len(arr)):
        window = arr[max(0, i - 1) : min(len(arr), i + 2)]
        smoothed.append(round(float(np.mean(window)), 3))
    
    key = clip.replace(".mp3", "")
    results[key] = smoothed
    print(f"Processed {clip}: {len(smoothed)} frames (max RMS: {max_val:.4f})")

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"\nSaved audio envelopes to {OUT_JSON}")

