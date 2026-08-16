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
        logging.FileHandler('entrance_bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── CONFIG ───────────────────────────────────────────────
YT_API_KEY     = os.environ.get('YT_API_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
CLIENT_SECRET  = 'client_secret.json'
TOKEN_FILE     = 'entrance_token.json'
HISTORY_FILE   = 'entrance_history.json'

DAILY_COMMENT_LIMIT = 4
DAILY_REPLY_LIMIT   = 4
MIN_VIDEO_VIEWS     = 1000
MAX_VIDEO_VIEWS     = 500000
MAX_VIDEO_AGE_DAYS  = 90

# History entries older than this are dropped on save — the bot never revisits
# videos/comments beyond MAX_VIDEO_AGE_DAYS, so pruned entries can't cause a
# re-comment/re-reply. Keeps entrance_history.json from growing forever.
HISTORY_TRIM_DAYS   = MAX_VIDEO_AGE_DAYS + 5

TEST_MODE = False

SEARCH_QUERIES = [
    # ── JEE ───────────────────────────────────────────────────
    'jee main 2027 preparation strategy',
    'jee advanced 2027 preparation tips',
    'jee main physics important chapters',
    'jee main chemistry organic revision',
    'jee main maths previous year questions',
    'jee mock test analysis how to improve',
    'jee dropper year strategy 2027',

    # ── NEET ──────────────────────────────────────────────────
    'neet 2027 preparation strategy',
    'neet biology ncert important questions',
    'neet chemistry revision plan',
    'neet physics numericals practice',
    'neet dropper batch self study',
    'neet mock test score improve',

    # ── CUET / BITSAT ─────────────────────────────────────────
    'cuet 2027 preparation general test',
    'cuet domain subject preparation tips',
    'bitsat 2027 preparation strategy',
    'bitsat english logical reasoning tips',

    # ── Cross-cutting / Hinglish ──────────────────────────────
    'jee neet ka syllabus kaise complete kare',
    'entrance exam preparation kaise kare',
    'class 12 ke baad entrance exam prep',
    'jee neet mock test kaise de',
]

SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']

APP_CONTEXT = """
App name: Aspirant Arcade
Purpose: Free MCQ and mock-test practice for JEE Main, JEE Advanced, NEET, CUET, and BITSAT aspirants

Key features:
1. Gamified MCQ modes: MCQ Blitz, Survival (timed, limited lives), Match the Following, Syllabus Slasher
2. Exam-specific question sets calibrated to JEE/NEET/CUET/BITSAT syllabus depth, not generic NCERT-only content
3. Insights dashboard — accuracy tracking per topic so you know exactly what to revise
4. Smart bookmarks for tough questions, with personal notes
5. Free — no signup needed for basic practice, optional own Gemini key for unlimited fresh questions
6. Available on Android and web

Target users: Class 11-12 students and droppers preparing for JEE Main/Advanced, NEET, CUET, or BITSAT
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
            log.warning("entrance_history.json corrupt — starting fresh")
    return {'commented_videos': {}, 'replied_comments': {}}

def trim_history(h, max_age_days):
    """Drops commented_videos/replied_comments entries older than max_age_days.
    Safe because the bot never revisits videos/comments outside its own age
    windows, so a pruned entry could never have caused a duplicate action."""
    cutoff = datetime.now() - timedelta(days=max_age_days)
    for key in ('commented_videos', 'replied_comments'):
        for entry_id in list(h.get(key, {}).keys()):
            ts = h[key][entry_id].get('timestamp')
            try:
                if ts and datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') < cutoff:
                    del h[key][entry_id]
            except ValueError:
                pass  # unparsable timestamp — leave it rather than risk dropping live data
    return h

def save_history(h):
    trim_history(h, HISTORY_TRIM_DAYS)
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
    # Exams
    'jee main', 'jee advanced', 'jee mains', 'neet', 'cuet', 'bitsat',
    'jee 2026', 'jee 2027', 'neet 2026', 'neet 2027', 'cuet 2026', 'bitsat 2026',

    # Stages / cohorts
    'dropper', 'repeater batch', 'class 11', 'class 12', '12th pass',
    'entrance exam', 'engineering entrance', 'medical entrance',

    # Subjects
    'physics numericals', 'organic chemistry', 'inorganic chemistry',
    'physical chemistry', 'jee maths', 'neet biology', 'botany zoology',
    'ncert biology', 'jee physics', 'neet physics',

    # Study terms
    'mock test analysis', 'previous year questions', 'pyq', 'rank predictor',
    'cutoff', 'counselling', 'admission', 'revision plan', 'formula sheet',
    'important questions', 'chapter wise weightage', 'test series',

    # Hinglish
    'taiyari kaise kare', 'syllabus complete kaise kare', 'self study se crack',
    'coaching ke bina', 'rank kaise aaye',
]

# ── COMMENT KEYWORDS (for scanning replies) ──────────────
COMMENT_KEYWORDS = [
    'prepare', 'preparation', 'how to prepare', 'how to score', 'how to crack',
    'suggest', 'resource', 'material', 'study material', 'notes',
    'study', 'practice', 'mock test', 'test series', 'previous year',
    'tips', 'help', 'guide', 'recommend', 'strategy', 'plan',
    'syllabus', 'pattern', 'book', 'reference', 'pdf', 'rank',
    'app', 'website', 'online', 'channel', 'playlist', 'course',
    'nervous', 'scared', 'worried', 'confused', 'struggling',
    'stressed', 'anxious', 'not sure', "don't know", 'lost',
    'dropper', 'repeat year', 'low score', 'improve score',
    'kaise', 'kya', 'batao', 'suggest karo', 'koi bata',
    'padhai', 'taiyari', 'crack kaise', 'koi app', 'best resource',
    'help chahiye', 'pls help', 'please help', 'bhai', 'yaar',
]

def is_video_relevant(title: str, description: str) -> tuple[bool, str]:
    text = (title + ' ' + description[:200]).lower()
    matched = [kw for kw in VIDEO_KEYWORDS if kw in text]
    if matched:
        return True, f"matched: {', '.join(matched[:3])}"
    return False, 'no entrance-exam keywords found'

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
        prompt = f"""Write a genuine YouTube comment from a JEE/NEET/CUET/BITSAT aspirant who naturally mentions using an app for MCQ practice.

{APP_CONTEXT}

Video title: {video_title}
Video description (first 400 chars): {video_description[:400]}

Rules:
- Read the video title carefully and make the comment SPECIFIC to what the video is about
- Sound like a real aspirant sharing personal experience, NOT advertising
- Mention Aspirant Arcade once, naturally, as something you personally use for MCQ practice
- 2 sentences max — tight, casual, Hinglish OK
- No exclamation marks, no "Great video!", no hollow praise
- No URLs or links — app name only

Write ONLY the comment text, nothing else."""
    else:
        prompt = f"""Write a genuine YouTube comment from a JEE/NEET/CUET/BITSAT aspirant watching this video.

Video title: {video_title}
Video description (first 400 chars): {video_description[:400]}

Rules:
- Comment must be SPECIFIC to the topic in this video — mention the subject, chapter, or concept
- Share a real study tip, ask a genuine question about the topic, or relate a personal experience with this subject
- Sound like a real aspirant, NOT a bot
- 1-2 sentences, casual, Hinglish OK
- Do NOT say "Great video!" or any generic praise
- Do NOT mention any app, product, or website

Write ONLY the comment text, nothing else."""

    text = gemini(prompt)
    return force_no_link(text)

def generate_reply(comment_text: str, video_title: str) -> str:
    mention_app = random.random() < 0.35

    if mention_app:
        prompt = f"""Write a helpful reply to this YouTube comment from a fellow aspirant who uses Aspirant Arcade for MCQ practice.

{APP_CONTEXT}

Video: {video_title}
Comment: "{comment_text}"

Rules:
- Directly answer or address what they said first — don't skip to the app
- Mention Aspirant Arcade once, naturally, as your own go-to for MCQ practice
- 2 sentences max, casual, Hinglish OK
- No URLs, no salesy tone, no emojis

Write ONLY the reply text, nothing else."""
    else:
        prompt = f"""Write a helpful, genuine reply to this YouTube comment from a fellow aspirant.

Video: {video_title}
Comment: "{comment_text}"

Rules:
- Directly address what they said — give real, specific advice relevant to their question
- Sound like a fellow JEE/NEET/CUET/BITSAT aspirant, not a tutor or promoter
- 1-2 sentences, casual, Hinglish OK
- Do NOT mention any app, website, or product

Write ONLY the reply text, nothing else."""

    text = gemini(prompt)
    return force_no_link(text)

# ── YOUTUBE ACTIONS ──────────────────────────────────────
def search_videos(query: str, pub, max_results=10) -> list:
    try:
        published_after = (
            datetime.now(timezone.utc) - timedelta(days=MAX_VIDEO_AGE_DAYS)
        ).strftime('%Y-%m-%dT%H:%M:%SZ')

        res = pub.search().list(
            q=query,
            part='snippet',
            type='video',
            maxResults=max_results,
            relevanceLanguage='hi',
            regionCode='IN',
            order='relevance',
            videoDuration='medium',
            publishedAfter=published_after,
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
                    log.debug(f"    Skip (too old: {age.days} days): {item['snippet']['title'][:50]}")
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
    log.info("=== Entrance Bot starting ===")
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
