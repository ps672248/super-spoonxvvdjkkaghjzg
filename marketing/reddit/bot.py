# pip install praw google-generativeai python-dotenv

import os, time, random, json, logging
import praw
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

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
REDDIT_CLIENT_ID     = os.environ.get('REDDIT_CLIENT_ID', '')
REDDIT_CLIENT_SECRET = os.environ.get('REDDIT_CLIENT_SECRET', '')
REDDIT_USERNAME      = os.environ.get('REDDIT_USERNAME', '')
REDDIT_PASSWORD      = os.environ.get('REDDIT_PASSWORD', '')
GEMINI_API_KEY       = os.environ.get('GEMINI_API_KEY', '')
HISTORY_FILE         = 'history.json'

TEST_MODE = True   # True = short delays | False = production delays
APP_LINK  = 'https://aspirant-arcade.vercel.app'

# Max per day — stay under Reddit spam radar
DAILY_POST_LIMIT    = 2    # new posts per day
DAILY_COMMENT_LIMIT = 8    # comments/replies per day

TARGET_SUBREDDITS = [
    'GATE',
    'PSUaspirants',
    'indianengineeringstudents',
    'india',
    'EngineeringStudents',
    'GATEpreparation',
    'IndianEngineers',
]

SEARCH_KEYWORDS = [
    'PSU interview preparation',
    'BHEL interview tips',
    'ONGC preparation',
    'PSU GD PI round',
    'how to crack PSU',
    'GATE PSU jobs',
    'PSU recruitment',
    'NTPC interview',
    'engineering govt job',
    'PSU selection process',
]

APP_CONTEXT = """
App name: Aspirant Arcade
Platform: Free web app at https://aspirant-arcade.vercel.app
Purpose: PSU exam preparation for Indian engineering graduates

Key features:
1. Gamified MCQ modes: MCQ Blitz, Survival (one wrong = game over), Match, Syllabus Slasher, Mario Runner
2. AI-powered interview simulation: Group Discussion with 3 AI candidates, Technical PI round, HR PI round
3. Branch-specific: EE, ME, CE, ECE, CS, Chemical, Petroleum
4. PSU-specific: BHEL, ONGC, NTPC, IOCL, PGCIL, HAL, BEL, GAIL, NPCIL
5. Uses own Gemini API key — questions generated fresh, stored on device only
6. Completely free, no signup required

Target users: B.Tech graduates preparing for PSU jobs through GATE
"""

# ── GEMINI ───────────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def gemini(prompt: str) -> str:
    try:
        resp = model.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        log.error(f"Gemini error: {e}")
        return ''

def force_link(text: str) -> str:
    text = text.strip()
    if APP_LINK not in text:
        text = f"{text}\n\n{APP_LINK}"
    return text

# ── HISTORY ──────────────────────────────────────────────
def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, encoding='utf-8') as f:
            return json.load(f)
    return {'commented_posts': [], 'replied_comments': [], 'posted_subs': []}

def save_history(h):
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(h, f, ensure_ascii=False, indent=2)

# ── REDDIT CLIENT ─────────────────────────────────────────
def get_reddit():
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        username=REDDIT_USERNAME,
        password=REDDIT_PASSWORD,
        user_agent='AspirantArcadeBot/1.0'
    )

# ── RELEVANCY ─────────────────────────────────────────────
def is_post_relevant(title: str, body: str) -> tuple[bool, str]:
    prompt = f"""Is this Reddit post relevant for promoting an Indian PSU exam preparation web app?

Post title: {title}
Post body (first 300 chars): {body[:300]}

Relevant means: asking about PSU recruitment, GATE exam prep, engineering interview preparation,
BHEL/ONGC/NTPC/IOCL interviews, GD/PI preparation, or engineering govt jobs in India.

Reply ONLY in this JSON format (no markdown):
{{"relevant": true/false, "reason": "one line reason"}}"""

    raw = gemini(prompt).replace('```json','').replace('```','').strip()
    try:
        result = json.loads(raw)
        return result['relevant'], result['reason']
    except:
        return False, 'parse error'

def is_comment_relevant(text: str) -> tuple[bool, str]:
    prompt = f"""Is this Reddit comment asking for help with PSU interview/GD/PI preparation or recommending resources?

Comment: "{text}"

Relevant means: asking for tips, resources, app recommendations, how to prepare for PSU interview/GD/PI,
expressing frustration, or seeking advice about PSU selection.

Reply ONLY in this JSON format (no markdown):
{{"relevant": true/false, "reason": "one line reason"}}"""

    raw = gemini(prompt).replace('```json','').replace('```','').strip()
    try:
        result = json.loads(raw)
        return result['relevant'], result['reason']
    except:
        return False, 'parse error'

# ── GENERATE TEXT ─────────────────────────────────────────
def generate_comment(post_title: str, post_body: str) -> str:
    prompt = f"""Write a genuine Reddit comment promoting this PSU prep app on this post.

{APP_CONTEXT}

Post title: {post_title}
Post body: {post_body[:400]}

Rules:
- Sound like a real person who used the app, not a bot
- Directly address what the post is about
- Mention specific feature relevant to their question
- Casual Reddit tone — no corporate language
- Max 4 sentences
- Do NOT start with "I" or "As someone"
- Do NOT include the link (added separately)

Write ONLY the comment text."""

    return force_link(gemini(prompt))

def generate_reply(comment_text: str, post_title: str) -> str:
    prompt = f"""Write a helpful Reddit reply to this comment that mentions our PSU prep app.

{APP_CONTEXT}

Post context: {post_title}
Comment: "{comment_text}"

Rules:
- Directly answer their question first
- Mention specific app feature that solves their problem
- Sound like a genuine helpful Redditor
- Max 3 sentences
- Casual tone
- Do NOT include the link (added separately)

Write ONLY the reply text."""

    return force_link(gemini(prompt))

def generate_post(subreddit: str) -> tuple[str, str]:
    prompt = f"""Write a Reddit post for r/{subreddit} promoting this PSU prep app.

{APP_CONTEXT}

Rules:
- Title: genuine, curiosity-driven, not clickbait
- Body: personal story style — "built this / found this" angle
- Mention 2-3 specific features
- End body with a call to try it
- Casual Reddit tone
- Do NOT make it sound like an ad
- Do NOT include the link in body (added separately)

Reply in this format exactly:
TITLE: <title here>
BODY: <body here>"""

    raw = gemini(prompt)
    try:
        title = raw.split('TITLE:')[1].split('BODY:')[0].strip()
        body  = raw.split('BODY:')[1].strip()
        return title, force_link(body)
    except:
        return '', ''

# ── MAIN ─────────────────────────────────────────────────
def run():
    log.info("=== Reddit Bot starting ===")
    history = load_history()
    reddit  = get_reddit()
    log.info(f"Logged in as: u/{reddit.user.me()}")

    comment_count = 0
    post_count    = 0

    # ── PART 1: Find relevant posts and comment ───────────
    for keyword in SEARCH_KEYWORDS:
        if comment_count >= DAILY_COMMENT_LIMIT:
            break

        log.info(f"Searching: '{keyword}'")

        for sub in TARGET_SUBREDDITS:
            if comment_count >= DAILY_COMMENT_LIMIT:
                break

            try:
                subreddit = reddit.subreddit(sub)
                results   = subreddit.search(keyword, sort='new', limit=10, time_filter='week')

                for post in results:
                    if comment_count >= DAILY_COMMENT_LIMIT:
                        break
                    if post.id in history['commented_posts']:
                        continue
                    if post.locked or post.archived:
                        continue
                    if post.score < 1:   # dead post
                        continue

                    title = post.title
                    body  = post.selftext or ''

                    log.info(f"  Post: {title[:60]} | r/{sub} | score:{post.score}")

                    relevant, reason = is_post_relevant(title, body)
                    if not relevant:
                        log.info(f"    Skip: {reason}")
                        continue

                    log.info(f"    Relevant: {reason}")
                    comment_text = generate_comment(title, body)

                    if not comment_text:
                        continue

                    log.info(f"    Commenting: {comment_text[:100]}...")

                    try:
                        post.reply(comment_text)
                        history['commented_posts'].append(post.id)
                        comment_count += 1
                        save_history(history)
                        log.info(f"    ✓ Comment posted ({comment_count}/{DAILY_COMMENT_LIMIT})")
                        log.info(f"    Full: {comment_text}")

                        delay = random.randint(15, 30) if TEST_MODE else random.randint(300, 600)
                        log.info(f"    Waiting {delay}s...")
                        time.sleep(delay)

                    except Exception as e:
                        log.error(f"    Post reply error: {e}")

            except Exception as e:
                log.error(f"  Subreddit error r/{sub}: {e}")

        time.sleep(5)

    # ── PART 2: Reply to relevant comments ───────────────
    log.info("Scanning comments for reply targets...")

    for sub in TARGET_SUBREDDITS:
        if comment_count >= DAILY_COMMENT_LIMIT:
            break

        try:
            subreddit = reddit.subreddit(sub)

            for post in subreddit.hot(limit=15):
                if comment_count >= DAILY_COMMENT_LIMIT:
                    break

                post.comments.replace_more(limit=0)

                for comment in post.comments.list():
                    if comment_count >= DAILY_COMMENT_LIMIT:
                        break
                    if comment.id in history['replied_comments']:
                        continue
                    if not comment.body or len(comment.body) < 20:
                        continue
                    if comment.author and comment.author.name == REDDIT_USERNAME:
                        continue  # don't reply to own comments

                    rel, reason = is_comment_relevant(comment.body)
                    if not rel:
                        continue

                    log.info(f"  Target comment: {comment.body[:80]}...")
                    reply_text = generate_reply(comment.body, post.title)

                    if not reply_text:
                        continue

                    try:
                        comment.reply(reply_text)
                        history['replied_comments'].append(comment.id)
                        comment_count += 1
                        save_history(history)
                        log.info(f"  ✓ Reply posted ({comment_count}/{DAILY_COMMENT_LIMIT})")
                        log.info(f"  Full: {reply_text}")

                        delay = random.randint(15, 30) if TEST_MODE else random.randint(300, 600)
                        log.info(f"  Waiting {delay}s...")
                        time.sleep(delay)

                    except Exception as e:
                        log.error(f"  Comment reply error: {e}")

        except Exception as e:
            log.error(f"Subreddit scan error r/{sub}: {e}")

    # ── PART 3: Post original content ────────────────────
    if post_count < DAILY_POST_LIMIT:
        post_subs = ['indianengineeringstudents', 'GATE']

        for sub in post_subs:
            if post_count >= DAILY_POST_LIMIT:
                break
            if sub in history['posted_subs']:
                continue

            log.info(f"Creating post in r/{sub}...")
            title, body = generate_post(sub)

            if not title or not body:
                continue

            log.info(f"  Title: {title}")

            try:
                reddit.subreddit(sub).submit(title, selftext=body)
                history['posted_subs'].append(sub)
                post_count += 1
                save_history(history)
                log.info(f"  ✓ Post submitted to r/{sub} ({post_count}/{DAILY_POST_LIMIT})")

                delay = random.randint(30, 60) if TEST_MODE else random.randint(600, 1200)
                log.info(f"  Waiting {delay}s...")
                time.sleep(delay)

            except Exception as e:
                log.error(f"  Submit error: {e}")

    log.info(f"=== Done. Comments: {comment_count}, Posts: {post_count} ===")

if __name__ == '__main__':
    run()
