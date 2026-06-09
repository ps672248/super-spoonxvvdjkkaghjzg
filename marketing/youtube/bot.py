# pip install google-api-python-client google-auth-oauthlib google-generativeai python-dotenv

import os, time, random, json, logging
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

DAILY_COMMENT_LIMIT = 5
DAILY_REPLY_LIMIT   = 10
MIN_VIDEO_VIEWS     = 3000
MAX_VIDEO_VIEWS     = 300000

TEST_MODE = True   # True = short delays (testing) | False = full delays (production)
APP_LINK  = 'https://aspirant-arcade.vercel.app'

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
Platform: Web app — accessible at https://aspirant-arcade.vercel.app
Purpose: PSU exam preparation for Indian engineering graduates

Key features:
1. Gamified MCQ modes: MCQ Blitz, Survival (one wrong = game over), Match, Syllabus Slasher, Mario Runner
2. AI-powered interview simulation: Group Discussion with 3 AI candidates, Technical PI round, HR PI round
3. Branch-specific content: EE, ME, CE, ECE, CS, Chemical, Petroleum
4. PSU-specific: filters by BHEL, ONGC, NTPC, IOCL, PGCIL, HAL, BEL, etc.
5. Uses user's own Gemini API key — questions generated fresh, stored on device only
6. Completely free to use — no signup required

Target users: B.Tech graduates preparing for PSU jobs through GATE
Website: https://aspirant-arcade.vercel.app
"""

# ── GEMINI CLIENT ────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3.1-flash-lite')

def gemini(prompt: str) -> str:
    try:
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        log.error(f"Gemini error: {e}")
        return ''

# ── HISTORY ──────────────────────────────────────────────
def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, encoding='utf-8') as f:
            return json.load(f)
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
    """Guarantee link appears at end regardless of what Gemini wrote"""
    text = text.strip()
    if APP_LINK not in text:
        text = f"{text}\nTry it free at {APP_LINK}"
    return text

def generate_top_comment(video_title: str, video_description: str) -> str:
    prompt = f"""Write a genuine YouTube comment promoting this app on this video.

{APP_CONTEXT}

Video title: {video_title}
Video description: {video_description[:300]}

Rules:
- Sound like a real person, not a bot
- Mention a specific relevant feature of the app that matches this video's topic
- Max 2 sentences then the link
- Casual tone, Hinglish is fine if it fits
- Do NOT use exclamation marks excessively
- Do NOT say "Great video!" or any fake compliments

Write ONLY the comment text, nothing else. Do not include the link."""

    text = gemini(prompt)
    return force_link(text)

def generate_reply(comment_text: str, video_title: str) -> str:
    prompt = f"""Write a helpful reply to this YouTube comment that naturally mentions our PSU prep app.

{APP_CONTEXT}

Video context: {video_title}
Comment to reply to: "{comment_text}"

Rules:
- Directly address what the person asked or said
- Mention the specific app feature that helps their problem
- Max 2 sentences then the link
- Casual, genuine tone — Hinglish OK
- Don't be salesy — be helpful first

Write ONLY the reply text, nothing else. Do not include the link."""

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

        comments = []
        for item in res.get('items', []):
            snip = item['snippet']['topLevelComment']['snippet']
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
