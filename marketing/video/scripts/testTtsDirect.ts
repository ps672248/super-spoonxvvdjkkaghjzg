import { EdgeTTS } from 'node-edge-tts';

async function test() {
  try {
    const tts = new EdgeTTS({ voice: 'hi-IN-MadhurNeural' });
    await tts.ttsPromise('Bhai sach bata phone uthaya tha 5 minute ke liye', 'test.mp3');
    console.log('Success with MadhurNeural!');
  } catch (e) {
    console.error('Error with MadhurNeural:', e);
  }

  try {
    const tts = new EdgeTTS({ voice: 'en-IN-NeerjaNeural' });
    await tts.ttsPromise('Hello friends welcome to Aspirant Arcade', 'test_en.mp3');
    console.log('Success with NeerjaNeural!');
  } catch (e) {
    console.error('Error with NeerjaNeural:', e);
  }
}

test();

