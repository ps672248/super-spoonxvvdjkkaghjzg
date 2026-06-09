# YouTube Comment Bot — Aspirant Arcade

Auto-finds relevant PSU/GATE YouTube videos and posts contextual comments + replies using Gemini AI.
Runs daily at 8 PM IST via GitHub Actions.

---

## What It Does

- Searches YouTube for PSU/GATE preparation videos (3K–300K views, India region, recent)
- Gemini checks if each video is actually relevant before commenting
- Gemini writes a unique comment tailored to that video's topic
- Scans top 30 comments — finds people asking for help
- Gemini writes contextual reply addressing their specific question
- Never hits same video/comment twice (tracked in `history.json`, committed back to repo)
- Logs everything to `bot.log`

**Daily limits:** 5 top-level comments + 10 replies

---

## Keys & Credentials Needed

| Secret | What it is | Where to get |
|---|---|---|
| `YT_API_KEY` | YouTube Data API key (for searching) | console.cloud.google.com |
| `GEMINI_API_KEY` | Gemini API key (for AI text generation) | aistudio.google.com |
| `YT_CLIENT_SECRET` | OAuth2 client credentials JSON | console.cloud.google.com |
| `YT_TOKEN` | OAuth2 token JSON (generated locally first) | Run bot locally once |

---

## One-Time Local Setup

### Step 1 — Get YouTube API Key
1. Go to https://console.cloud.google.com
2. Create new project
3. **APIs & Services** → **Enable APIs** → search **YouTube Data API v3** → Enable
4. **Credentials** → **Create Credentials** → **API Key**
5. Copy key → save as `YT_API_KEY`

### Step 2 — Get OAuth2 Client Secret
1. Same console → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Desktop App**
3. Download JSON → rename to `client_secret.json`
4. Place in `marketing/youtube/` folder

### Step 3 — Get Gemini API Key (Free)
1. Go to https://aistudio.google.com/app/apikey
2. **Create API Key**
3. Copy key → save as `GEMINI_API_KEY`

**Free tier:** 15 requests/min, 1 million tokens/day — more than enough.

### Step 4 — Generate token.json (run locally once)
```bash
cd marketing/youtube

# Install packages
pip install google-api-python-client google-auth-oauthlib google-generativeai

# Set your keys in bot.py temporarily OR export as env vars:
export YT_API_KEY="your_key"
export GEMINI_API_KEY="your_key"

# Run once — browser opens for Google OAuth login
python bot.py
```

After login, `token.json` is created in the folder. This is your OAuth token.

---

## GitHub Actions Setup

### Step 1 — Add Secrets to GitHub Repo
Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 4 secrets:

**`YT_API_KEY`**
```
paste your YouTube API key
```

**`GEMINI_API_KEY`**
```
paste your Gemini API key
```

**`YT_CLIENT_SECRET`**
```
paste entire contents of client_secret.json
```

**`YT_TOKEN`**
```
paste entire contents of token.json (generated in Step 4 above)
```

### Step 2 — Enable Actions Write Permission
Go to repo → **Settings** → **Actions** → **General** → **Workflow permissions**
Select: **Read and write permissions** → Save

This allows the bot to commit `history.json` back after each run.

### Step 3 — Push to GitHub
```bash
git add .github/workflows/youtube-bot.yml
git add marketing/youtube/
git commit -m "feat: add youtube comment bot"
git push
```

Bot runs automatically at **8 PM IST every day**.

### Manual Trigger
Go to repo → **Actions** → **YouTube Comment Bot** → **Run workflow**

---

## Files

| File | Purpose |
|---|---|
| `bot.py` | Main bot script |
| `client_secret.json` | OAuth credentials (you add, don't commit) |
| `token.json` | Auto-generated after first login (don't commit) |
| `history.json` | Tracks commented videos/comments (committed by Actions) |
| `bot.log` | Activity log (local only) |

> **Never commit `client_secret.json` or `token.json` to git.**
> They go into GitHub Secrets only.

Add to `.gitignore`:
```
marketing/youtube/client_secret.json
marketing/youtube/token.json
marketing/youtube/bot.log
```

---

## Workflow Schedule

```
Cron: '30 14 * * *'
= 14:30 UTC
= 8:00 PM IST
= runs every day
```

To change time: edit `youtube-bot.yml` cron value.
UTC to IST converter: IST = UTC + 5:30

---

## Tuning `bot.py`

```python
DAILY_COMMENT_LIMIT = 5      # max top-level comments/day (keep ≤ 10)
DAILY_REPLY_LIMIT   = 10     # max replies/day (keep ≤ 15)
MIN_VIDEO_VIEWS     = 3000   # ignore low-traffic videos
MAX_VIDEO_VIEWS     = 300000 # ignore mega-viral (comment buried)
```

Add/remove topics in `SEARCH_QUERIES` to target different PSU/GATE niches.

---

## Safety

- Unique AI-generated text every comment — never repeats
- Random delays: 4–9 min between comments, 3–6 min between replies
- history.json prevents double-commenting same video
- Daily limits prevent account flag
- Use aged Google account (3+ months with YouTube activity)
- Never put links in comments — mention app name only
