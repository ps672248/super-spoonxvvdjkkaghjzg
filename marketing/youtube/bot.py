# pip install google-api-python-client google-auth-oauthlib google-generativeai python-dotenv

import os, time, random, json, logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv()  # loads .env from current folder
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
        logging.FileHandler('bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── CONFIG ───────────────────────────────────────────────
YT_API_KEY     = os.environ.get('YT_API_KEY', '')      # set env var OR paste key here
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')  # set env var OR paste key here
CLIENT_SECRET  = 'client_secret.json'
TOKEN_FILE     = 'token.json'
HISTORY_FILE   = 'history.json'

DAILY_COMMENT_LIMIT = 9999   # no artificial limit — YouTube API quota is the real cap (~10k units/day)
DAILY_REPLY_LIMIT   = 9999   # same
MIN_VIDEO_VIEWS     = 3000
MAX_VIDEO_VIEWS     = 300000

TEST_MODE = False  # True = short delays (testing) | False = full delays (production)
APP_LINK  = 'https://qr.ae/pFYza2'

SEARCH_QUERIES = [
    'PSU interview preparation 2025',
    'BHEL interview tips engineering',
    'ONGC recruitment preparation',
    'NTPC GD PI round preparation',
    'how to crack PSU interview',
    'PSU group discussion tips',
    'GATE PSU selection process',
    'IOCL PGCIL interview preparation',
    'PSU technical interview engineering',
    'HAL BEL recruitment preparation',
]

SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']

APP_CONTEXT = """
App name: Aspirant Arcade
Platform: Web app — accessible at https://qr.ae/pFYza2
Purpose: PSU exam preparation for Indian engineering graduates

Key features:
1. Gamified MCQ modes: MCQ Blitz, Survival (one wrong = game over), Match, Syllabus Slasher, Mario Runner
2. AI-powered interview simulation: Group Discussion with 3 AI candidates, Technical PI round, HR PI round
3. Branch-specific content: EE, ME, CE, ECE, CS, Chemical, Petroleum
4. PSU-specific: filters by BHEL, ONGC, NTPC, IOCL, PGCIL, HAL, BEL, etc.
5. Uses user's own Gemini API key — questions generated fresh, stored on device only
6. Completely free to use — no signup required

Target users: B.Tech graduates preparing for PSU jobs through GATE
Website: https://qr.ae/pFYza2
"""

# ── GEMINI CLIENT ────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3.1-flash-lite')

GEMINI_CALL_DELAY = 5  # seconds between Gemini calls — free tier = 15 RPM = 1 per 4s

def gemini(prompt: str, retries: int = 4) -> str:
    import re as _re
    for attempt in range(retries):
        try:
            time.sleep(GEMINI_CALL_DELAY)  # throttle before every call
            resp = model.generate_content(prompt)
            return resp.text.strip()
        except Exception as e:
            err = str(e)
            log.error(f"Gemini error: {e}")
            # Extract retry_delay from 429 response and wait
            m = _re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err)
            wait = int(m.group(1)) + 5 if m else 60 * (attempt + 1)
            if '429' in err or 'quota' in err.lower() or 'rate' in err.lower():
                log.warning(f"  Rate limited. Waiting {wait}s before retry {attempt+1}/{retries}...")
                time.sleep(wait)
            else:
                return ''  # non-quota error, don't retry
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
            log.warning("history.json corrupt or empty — starting fresh")
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

# ── RELEVANCY CHECK VIA GEMINI ───────────────────────────
def is_video_relevant(title: str, description: str) -> tuple[bool, str]:
    prompt = f"""Is this YouTube video relevant for promoting an Indian PSU exam preparation app?

Video title: {title}
Video description (first 300 chars): {description[:300]}

Relevant means: the video is about PSU recruitment, GATE exam, engineering job preparation,
BHEL/ONGC/NTPC/IOCL interviews, GD/PI preparation, or engineering competitive exams in India.

Reply ONLY in this JSON format (no markdown, no code block):
{{"relevant": true/false, "reason": "one line reason"}}"""

    raw = gemini(prompt)
    try:
        # Strip markdown code blocks if Gemini adds them
        raw = raw.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw)
        return result['relevant'], result['reason']
    except:
        return False, 'parse error'

def is_comment_relevant(comment_text: str) -> tuple[bool, str]:
    prompt = f"""Is this YouTube comment asking for help or expressing a problem related to PSU interview/GD/PI preparation?

Comment: "{comment_text}"

Relevant means: asking for resources, tips, app recommendations, how to prepare for PSU interview/GD/PI,
expressing frustration about preparation, or seeking advice about PSU selection process.

Reply ONLY in this JSON format (no markdown, no code block):
{{"relevant": true/false, "reason": "one line reason"}}"""

    raw = gemini(prompt)
    try:
        raw = raw.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw)
        return result['relevant'], result['reason']
    except:
        return False, 'parse error'

# ── GENERATE COMMENT VIA GEMINI ──────────────────────────
def force_link(text: str) -> str:
    """Remove any links — YouTube deletes comments with URLs."""
    text = text.strip()
    if not text:
        return ''
    import re
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'aspirant-arcade\.\S+', '', text)
    text = re.sub(r'qr\.ae/\S+', '', text)
    text = text.strip()
    return text

def generate_top_comment(video_title: str, video_description: str) -> str:
    # 80% purely helpful (no app mention), 20% mention app naturally
    mention_app = random.random() < 0.20

    if mention_app:
        prompt = f"""Write a genuine YouTube comment from a PSU aspirant who naturally mentions using an app.

{APP_CONTEXT}

Video title: {video_title}
Video description: {video_description[:300]}

Rules:
- Sound like a real person sharing their own experience, NOT promoting
- Mention Aspirant Arcade once, naturally, as something you personally use
- Max 2-3 sentences total
- Casual tone, Hinglish OK
- No exclamation marks, no "Great video!", no fake hype
- Do NOT include any URLs

Write ONLY the comment text."""
    else:
        prompt = f"""Write a genuine, helpful YouTube comment from a PSU aspirant on this video.

Video title: {video_title}
Video description: {video_description[:300]}

Rules:
- Sound like a real person who watched this video
- Share a useful tip, personal experience, or ask a genuine question related to the video topic
- About PSU preparation, GATE, interviews, GD/PI — whatever the video is about
- 1-3 sentences, casual, Hinglish OK
- Do NOT mention any app, product, or website
- Do NOT say "Great video!" or fake compliments

Write ONLY the comment text."""

    text = gemini(prompt)
    return force_link(text)

def generate_reply(comment_text: str, video_title: str) -> str:
    mention_app = random.random() < 0.30  # 30% chance mention app in replies

    if mention_app:
        prompt = f"""Write a helpful reply to this YouTube comment. You personally use an app called Aspirant Arcade for PSU prep.

{APP_CONTEXT}

Video context: {video_title}
Comment: "{comment_text}"

Rules:
- Directly answer what they asked first
- Mention Aspirant Arcade naturally, once, as your own experience
- 2-3 sentences max, casual, Hinglish OK
- No URLs, no salesy language

Write ONLY the reply text."""
    else:
        prompt = f"""Write a helpful, genuine reply to this YouTube comment about PSU preparation.

Video context: {video_title}
Comment: "{comment_text}"

Rules:
- Directly address what they asked or said
- Give actually useful advice from a fellow aspirant's perspective
- 1-3 sentences, casual, Hinglish OK
- Do NOT mention any app, product, or website

Write ONLY the reply text."""

    text = gemini(prompt)
    return force_link(text)

# ── YOUTUBE ACTIONS ──────────────────────────────────────
def search_videos(query: str, pub, max_results=8) -> list:
    try:
        res = pub.search().list(
            q=query,
            part='snippet',
            type='video',
            maxResults=max_results,
            relevanceLanguage='hi',
            regionCode='IN',
            order='date',
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

            # Skip videos older than 2 weeks
            published_at = s['snippet'].get('publishedAt', '')
            if published_at:
                pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                age = datetime.now(timezone.utc) - pub_date
                if age > timedelta(days=60):
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

        cutoff = datetime.now(timezone.utc) - timedelta(days=60)
        comments = []
        for item in res.get('items', []):
            snip = item['snippet']['topLevelComment']['snippet']
            # Skip comments older than 2 weeks
            published_at = snip.get('publishedAt', '')
            if published_at:
                pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                if pub_date < cutoff:  # skip comments older than 60 days
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
    log.info("=== Bot starting ===")
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

            relevant, reason = is_video_relevant(video['title'], video['description'])
            if not relevant:
                log.info(f"    Skip (not relevant): {reason}")
                continue
            log.info(f"    Relevant: {reason}")

            # Top-level comment
            if str(vid_id) not in history['commented_videos'] and comment_count < DAILY_COMMENT_LIMIT:
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

            # Replies
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
