#!/usr/bin/env python3
"""Package High Roller for a host website (spindecks.app).

    python3 tools/build-host.py <out-dir> <chat-url> <anon-key> [bridge-src]

Copies the game into <out-dir> and rewrites its index.html so that:
  - window.HR_HOST is defined before any game script runs (chat goes through the
    host's server; the personal "Fin" layer stays off until the host says the
    signed-in account is the owner),
  - the host's bridge module (default ../bridge.js) checks the account and fills in
    HR_HOST (premium, owner, chats left, a token getter),
  - the game's own service worker and install manifest are left out (the host
    site has its own).
"""
import json, os, re, shutil, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out, chat_url, anon = sys.argv[1], sys.argv[2], sys.argv[3]
bridge = sys.argv[4] if len(sys.argv) > 4 else '../bridge.js'

if os.path.exists(out):
    shutil.rmtree(out)
os.makedirs(out)
for d in ('css', 'js', 'icons'):
    shutil.copytree(os.path.join(root, d), os.path.join(out, d))

html = open(os.path.join(root, 'index.html')).read()
html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html)
html = html.replace("</title>", "</title>\n<meta name=\"robots\" content=\"noindex\">", 1)
stub = ('<script>window.HR_HOST = { pending: true, premium: false, owner: false, cap: 100, '
        f'chatUrl: {json.dumps(chat_url)}, anon: {json.dumps(anon)} }};</script>\n'
        f'<script type="module" src="{bridge}"></script>\n')
first = html.index('<script src=')
html = html[:first] + stub + html[first:]
open(os.path.join(out, 'index.html'), 'w').write(html)
print('built', out)
