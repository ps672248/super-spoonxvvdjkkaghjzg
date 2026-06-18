# pip install google-api-python-client google-auth-oauthlib google-generativeai python-dotenv

import os, time, random, json, logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv()
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import google.generativeai as genai

# ── LOGGING ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('schooling_bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── CONFIG ───────────────────────────────────────────────
YT_API_KEY     = os.environ.get('YT_API_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
CLIENT_SECRET  = 'client_secret.json'
TOKEN_FILE     = 'schooling_token.json'
HISTORY_FILE   = 'schooling_history.json'

DAILY_COMMENT_LIMIT = 4
DAILY_REPLY_LIMIT   = 4
MIN_VIDEO_VIEWS     = 1000
MAX_VIDEO_VIEWS     = 500000
MAX_VIDEO_AGE_DAYS  = 90

TEST_MODE = False

SEARCH_QUERIES = [
    # ── Evergreen NCERT concept explanations ─────────────────
    'class 10 science NCERT chapter explained',
    'class 9 science NCERT tutorial hindi',
    'class 12 physics NCERT concepts explained',
    'class 11 chemistry organic reactions NCERT',
    'class 10 maths NCERT chapter solution',
    'class 12 biology NCERT chapter notes',
    'class 11 physics mechanics NCERT',
    'class 9 maths NCERT chapter explanation',
    'class 10 electricity NCERT',
    'photosynthesis class 10 science NCERT',
    'motion class 9 science NCERT explained',
    'class 10 trigonometry maths tutorial',
    'class 12 organic chemistry NCERT reactions',
    'class 11 thermodynamics physics NCERT',
    'class 10 heredity evolution science',

    # ── JEE / NEET foundation (always active) ────────────────
    'neet 2027 class 11 biology preparation',
    'jee 2027 class 11 physics preparation',
    'neet foundation class 11 chemistry NCERT',
    'jee mains class 11 maths preparation',
    'class 12 neet biology chapter wise revision',
    'class 11 jee physics important chapters',

    # ── New academic session (June–Aug annually) ─────────────
    'class 11 new session 2026 how to study',
    'class 9 new session study plan 2026',
    'class 10 syllabus 2026 27 cbse preparation',
    'class 12 boards 2027 preparation start now',
    'how to study class 11 physics from scratch',
    'class 10 maths preparation 2027 boards',

    # ── Hinglish / regional (high Indian traffic) ─────────────
    'class 10 science padhai kaise kare',
    'NCERT class 11 physics kaise padhe',
    'class 12 chemistry MCQ practice hindi',
    'class 9 10 study tips hindi',
]

SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']

APP_CONTEXT = """
App name: Aspirant Arcade
Purpose: Free MCQ and exam practice for Class 9–12 CBSE/NCERT students

Key features:
1. Chapter-wise MCQ practice for Science, Maths, Physics, Chemistry, Biology, SST, English
2. True/False, Match the Following, and survival-style MCQ game modes
3. Covers Class 9, 10, 11, 12 — all major CBSE/NCERT subjects
4. Also useful for JEE/NEET foundation — all NCERT chapters covered
5. Free — no signup needed for basic practice
6. Available on Android and web

Target users: Class 9–12 students — board exam prep AND JEE/NEET foundation via NCERT
(Do NOT include any URLs or links in comments — mention app name only)
"""

# ── GEMINI CLIENT ────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3.1-flash-lite')

GEMINI_CALL_DELAY = 5

def gemini(prompt: str, retries: int = 4) -> str:
    import re as _re
    for attempt in range(retries):
        try:
            time.sleep(GEMINI_CALL_DELAY)
            resp = model.generate_content(prompt)
            return resp.text.strip()
        except Exception as e:
            err = str(e)
            log.error(f"Gemini error: {e}")
            m = _re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err)
            wait = int(m.group(1)) + 5 if m else 60 * (attempt + 1)
            if '429' in err or 'quota' in err.lower() or 'rate' in err.lower():
                log.warning(f"  Rate limited. Waiting {wait}s before retry {attempt+1}/{retries}...")
                time.sleep(wait)
            else:
                return ''
    log.error("Gemini failed after all retries.")
    return ''

# ── HISTORY ──────────────────────────────────────────────
def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, encoding='utf-8') as f:
                data = json.load(f)
                if 'commented_videos' not in data:
                    data['commented_videos'] = {}
                if 'replied_comments' not in data:
                    data['replied_comments'] = {}
                return data
        except (json.JSONDecodeError, ValueError):
            log.warning("schooling_history.json corrupt — starting fresh")
    return {'commented_videos': {}, 'replied_comments': {}}

def save_history(h):
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(h, f, ensure_ascii=False, indent=2)

# ── AUTH ─────────────────────────────────────────────────
def get_auth_client():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
    return build('youtube', 'v3', credentials=creds)

def get_public_client():
    return build('youtube', 'v3', developerKey=YT_API_KEY)

# ── VIDEO KEYWORDS ───────────────────────────────────────
VIDEO_KEYWORDS = [
    # Class levels
    'class 9', 'class 10', 'class 11', 'class 12',
    '9th class', '10th class', '11th class', '12th class',
    '9th standard', '10th standard', '11th standard', '12th standard',
    'secondary school', 'higher secondary',

    # Boards / curriculum
    'cbse', 'ncert', 'icse', 'isc', 'state board', 'up board', 'mp board',
    'board exam', 'board exams', 'boards 2025', 'boards 2026',
    'term 1', 'term 2', 'annual exam',

    # Subjects
    'science mcq', 'maths mcq', 'physics ncert', 'chemistry ncert',
    'biology ncert', 'sst', 'social science', 'english grammar',
    'accountancy', 'business studies', 'economics class',
    'hindi vyakaran', 'sanskrit class',

    # Study terms
    'important questions', 'chapter wise', 'revision notes',
    'sample paper', 'previous year paper', 'mock test class',
    'padhna hai', 'taiyari kaise', 'study tips class',
    'ncert solutions', 'short notes', 'quick revision',

    # Scoring / results
    '90 percent boards', '95 percent class 12', 'topper strategy',
    'score high boards', 'cbse result', 'marksheet',
]

# ── COMMENT KEYWORDS (for scanning replies) ──────────────
COMMENT_KEYWORDS = [
    'prepare', 'preparation', 'how to prepare', 'how to score',
    'suggest', 'resource', 'material', 'study material', 'notes',
    'study', 'practice', 'mock test', 'sample paper',
    'tips', 'help', 'guide', 'recommend', 'strategy', 'plan',
    'syllabus', 'pattern', 'book', 'reference', 'pdf',
    'app', 'website', 'online', 'channel', 'playlist',
    'nervous', 'scared', 'worried', 'confused', 'struggling',
    'stressed', 'anxious', 'not sure', "don't know", 'lost',
    'first time', 'no idea', 'any idea',
    'kaise', 'kya', 'batao', 'suggest karo', 'koi bata',
    'padhai', 'taiyari', 'crack kaise', 'koi app', 'best resource',
    'help chahiye', 'pls help', 'please help', 'bhai', 'yaar',
]

def is_video_relevant(title: str, description: str) -> tuple[bool, str]:
    text = (title + ' ' + description[:200]).lower()
    matched = [kw for kw in VIDEO_KEYWORDS if kw in text]
    if matched:
        return True, f"matched: {', '.join(matched[:3])}"
    return False, 'no schooling keywords found'

def is_comment_relevant(comment_text: str) -> tuple[bool, str]:
    text = comment_text.lower()
    matched = [kw for kw in COMMENT_KEYWORDS if kw in text]
    if matched:
        return True, f"matched: {', '.join(matched[:3])}"
    return False, 'no relevant keywords'

# ── GENERATE COMMENT VIA GEMINI ──────────────────────────
def force_no_link(text: str) -> str:
    """Strip any URLs — YouTube deletes comments with links."""
    text = text.strip()
    if not text:
        return ''
    import re
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'aspirant-arcade\.\S+', '', text)
    text = re.sub(r'qr\.ae/\S+', '', text)
    return text.strip()

def generate_top_comment(video_title: str, video_description: str) -> str:
    mention_app = random.random() < 0.25

    if mention_app:
        prompt = f"""Write a genuine YouTube comment from a class 9-12 student who naturally mentions using an app for NCERT/CBSE practice.

{APP_CONTEXT}

Video title: {video_title}
Video description (first 400 chars): {video_description[:400]}

Rules:
- Read the video title carefully and make the comment SPECIFIC to what the video is about
- Sound like a real student sharing personal experience, NOT advertising
- Mention Aspirant Arcade once, naturally, as something you personally use for MCQ practice
- 2 sentences max — tight, casual, Hinglish OK
- No exclamation marks, no "Great video!", no hollow praise
- No URLs or links — app name only
- If video is about JEE/NEET, comment as a class 11-12 student using NCERT MCQ practice

Write ONLY the comment text, nothing else."""
    else:
        prompt = f"""Write a genuine YouTube comment from a student watching this NCERT/CBSE video.

Video title: {video_title}
Video description (first 400 chars): {video_description[:400]}

Rules:
- Comment must be SPECIFIC to the topic in this video — mention the subject, chapter, or concept
- Share a real study tip, ask a genuine question about the topic, or relate a personal experience with this subject
- Sound like a real class 9-12 student, NOT a bot
- 1-2 sentences, casual, Hinglish OK
- Do NOT say "Great video!" or any generic praise
- Do NOT mention any app, product, or website

Write ONLY the comment text, nothing else."""

    text = gemini(prompt)
    return force_no_link(text)

def generate_reply(comment_text: str, video_title: str) -> str:
    mention_app = random.random() < 0.35

    if mention_app:
        prompt = f"""Write a helpful reply to this YouTube comment from a fellow student who uses Aspirant Arcade for NCERT MCQ practice.

{APP_CONTEXT}

Video: {video_title}
Comment: "{comment_text}"

Rules:
- Directly answer or address what they said first — don't skip to the app
- Mention Aspirant Arcade once, naturally, as your own go-to for NCERT MCQ practice
- 2 sentences max, casual, Hinglish OK
- No URLs, no salesy tone, no emojis

Write ONLY the reply text, nothing else."""
    else:
        prompt = f"""Write a helpful, genuine reply to this YouTube comment from a fellow student.

Video: {video_title}
Comment: "{comment_text}"

Rules:
- Directly address what they said — give real, specific advice relevant to their question
- Sound like a fellow class 9-12 student, not a tutor or promoter
- 1-2 sentences, casual, Hinglish OK
- Do NOT mention any app, website, or product

Write ONLY the reply text, nothing else."""

    text = gemini(prompt)
    return force_no_link(text)

# ── YOUTUBE ACTIONS ──────────────────────────────────────
def search_videos(query: str, pub, max_results=10) -> list:
    try:
        res = pub.search().list(
            q=query,
            part='snippet',
            type='video',
            maxResults=max_results,
            relevanceLanguage='hi',
            regionCode='IN',
            order='relevance',
            videoDuration='medium',
        ).execute()

        videos = []
        for item in res.get('items', []):
            vid_id = item['id']['videoId']
            stats = pub.videos().list(
                part='statistics,snippet',
                id=vid_id
            ).execute()

            if not stats['items']:
                continue

            s = stats['items'][0]
            views = int(s['statistics'].get('viewCount', 0))
            comments_disabled = s['statistics'].get('commentCount') is None

            if comments_disabled:
                continue
            if views < MIN_VIDEO_VIEWS or views > MAX_VIDEO_VIEWS:
                continue

            published_at = s['snippet'].get('publishedAt', '')
            if published_at:
                pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                age = datetime.now(timezone.utc) - pub_date
                if age > timedelta(days=MAX_VIDEO_AGE_DAYS):
                    log.info(f"    Skip (too old: {age.days} days): {item['snippet']['title'][:50]}")
                    continue

            videos.append({
                'id': vid_id,
                'title': item['snippet']['title'],
                'description': item['snippet']['description'],
                'views': views,
                'url': f"https://youtube.com/watch?v={vid_id}"
            })

        return videos
    except Exception as e:
        log.error(f"Search error: {e}")
        return []

def get_video_comments(pub, video_id: str, max_results=30) -> list:
    try:
        res = pub.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=max_results,
            order='relevance',
            textFormat='plainText'
        ).execute()

        cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_VIDEO_AGE_DAYS)
        comments = []
        for item in res.get('items', []):
            snip = item['snippet']['topLevelComment']['snippet']
            published_at = snip.get('publishedAt', '')
            if published_at:
                pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                if pub_date < cutoff:
                    continue
            comments.append({
                'id': item['snippet']['topLevelComment']['id'],
                'text': snip['textOriginal'],
                'author': snip['authorDisplayName'],
                'likes': snip.get('likeCount', 0),
            })
        return comments
    except Exception as e:
        log.error(f"Get comments error: {e}")
        return []

def post_comment(auth, video_id: str, text: str) -> bool:
    try:
        auth.commentThreads().insert(
            part='snippet',
            body={
                'snippet': {
                    'videoId': video_id,
                    'topLevelComment': {
                        'snippet': {'textOriginal': text}
                    }
                }
            }
        ).execute()
        return True
    except Exception as e:
        log.error(f"Post comment error: {e}")
        return False

def post_reply(auth, parent_comment_id: str, text: str) -> bool:
    try:
        auth.comments().insert(
            part='snippet',
            body={
                'snippet': {
                    'parentId': parent_comment_id,
                    'textOriginal': text
                }
            }
        ).execute()
        return True
    except Exception as e:
        log.error(f"Post reply error: {e}")
        return False

# ── MAIN ─────────────────────────────────────────────────
def run():
    log.info("=== Schooling Bot starting ===")
    history = load_history()
    pub  = get_public_client()
    auth = get_auth_client()

    comment_count = 0
    reply_count   = 0

    for query in SEARCH_QUERIES:
        if comment_count >= DAILY_COMMENT_LIMIT and reply_count >= DAILY_REPLY_LIMIT:
            log.info("Daily limits reached. Done.")
            break

        log.info(f"Query: '{query}'")
        videos = search_videos(query, pub)
        log.info(f"  Found {len(videos)} eligible videos")

        for video in videos:
            if comment_count >= DAILY_COMMENT_LIMIT and reply_count >= DAILY_REPLY_LIMIT:
                break

            vid_id = video['id']
            log.info(f"  Video: {video['title'][:60]} | {video['views']:,} views")

            if str(vid_id) in history['commented_videos']:
                log.info(f"    Skip (already handled): {video['title'][:50]}")
                continue

            relevant, reason = is_video_relevant(video['title'], video['description'])
            if not relevant:
                log.info(f"    Skip (not relevant): {reason}")
                continue
            log.info(f"    Relevant: {reason}")

            if comment_count < DAILY_COMMENT_LIMIT:
                comment_text = generate_top_comment(video['title'], video['description'])
                if not comment_text:
                    continue
                log.info(f"    Posting comment: {comment_text[:80]}...")

                if post_comment(auth, vid_id, comment_text):
                    history['commented_videos'][vid_id] = {
                        'video_title': video['title'],
                        'video_url':   video['url'],
                        'bot_comment': comment_text,
                        'timestamp':   time.strftime('%Y-%m-%d %H:%M:%S'),
                    }
                    comment_count += 1
                    save_history(history)
                    log.info(f"    ✓ Comment posted ({comment_count}/{DAILY_COMMENT_LIMIT})")
                    log.info(f"    Full comment: {comment_text}")
                    delay = random.randint(10, 20) if TEST_MODE else random.randint(240, 540)
                    log.info(f"    Waiting {delay}s...")
                    time.sleep(delay)

            if reply_count < DAILY_REPLY_LIMIT:
                comments = get_video_comments(pub, vid_id)
                log.info(f"    Scanning {len(comments)} comments...")

                for c in comments:
                    if reply_count >= DAILY_REPLY_LIMIT:
                        break
                    if c['id'] in history['replied_comments']:
                        continue
                    if len(c['text']) < 20:
                        continue

                    rel, reason = is_comment_relevant(c['text'])
                    if not rel:
                        continue

                    log.info(f"    Target: {c['text'][:60]}...")
                    reply_text = generate_reply(c['text'], video['title'])
                    if not reply_text:
                        continue
                    log.info(f"    Reply: {reply_text[:80]}...")

                    if post_reply(auth, c['id'], reply_text):
                        history['replied_comments'][c['id']] = {
                            'user':          c['author'],
                            'user_comment':  c['text'][:120] + '...' if len(c['text']) > 120 else c['text'],
                            'bot_reply':     reply_text,
                            'video_title':   video['title'],
                            'video_url':     video['url'],
                            'timestamp':     time.strftime('%Y-%m-%d %H:%M:%S'),
                        }
                        reply_count += 1
                        save_history(history)
                        log.info(f"    ✓ Reply posted ({reply_count}/{DAILY_REPLY_LIMIT})")
                        log.info(f"    Full reply: {reply_text}")
                        delay = random.randint(10, 20) if TEST_MODE else random.randint(180, 360)
                        log.info(f"    Waiting {delay}s...")
                        time.sleep(delay)

        time.sleep(10)

    log.info(f"=== Done. Comments: {comment_count}, Replies: {reply_count} ===")

if __name__ == '__main__':
    run()
