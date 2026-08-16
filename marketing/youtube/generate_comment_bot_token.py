"""
One-time local script — grants a persona comment-bot's OAuth token
(scope youtube.force-ssl), needed by bot.py / schooling_bot.py /
entrance_bot.py / govt_bot.py / college_bot.py to post comments/replies.

Each of the 5 bots authenticates as a DIFFERENT Google account (persona
account, not the brand channel) — run this once per persona, logging in
as that persona's account when the browser opens, with the matching
output filename:

    python generate_comment_bot_token.py token.json             # PSU/engineering -> YT_TOKEN
    python generate_comment_bot_token.py schooling_token.json    # -> YT_TOKEN_SCHOOLING
    python generate_comment_bot_token.py entrance_token.json     # -> YT_TOKEN_ENTRANCE
    python generate_comment_bot_token.py govt_token.json         # -> YT_TOKEN_GOVT
    python generate_comment_bot_token.py college_token.json      # -> YT_TOKEN_COLLEGE

Requires client_secret.json in this directory (same OAuth client already
used by the bots). After running, paste the generated file's contents
(minified to one line) into .env.config under the matching key, then
`npm run env:sync` from scripts/.
"""
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
CLIENT_SECRET = 'client_secret.json'

def main():
    if len(sys.argv) != 2:
        print(f'Usage: python {sys.argv[0]} <output_token_file.json>')
        print('  e.g. token.json | schooling_token.json | entrance_token.json | govt_token.json | college_token.json')
        sys.exit(1)

    token_file = sys.argv[1]
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
    creds = flow.run_local_server(port=0)

    with open(token_file, 'w') as f:
        f.write(creds.to_json())

    print(f'\nSaved {token_file} — minify its JSON to one line and paste as the matching YT_TOKEN* value in .env.config.')

if __name__ == '__main__':
    main()
