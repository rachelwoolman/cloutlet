#!/usr/bin/env python3
"""Builds docs/screen-review/index.html: a self-contained review page with screenshots embedded."""
import base64, html, os, sys

JPG = sys.argv[1]
OUT = sys.argv[2]

def img(name):
    with open(os.path.join(JPG, name + '.jpg'), 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()

B, C, A = 'Business', 'Creator', 'Both'

# (id, title, detail, who, tag, note)   tag: '', 'new', 'cut'
screens = [
  dict(id='welcome', n=1, tab=None, title='Welcome', blurb='The first screen. You pick which side you\'re on.',
    shots=[('01-welcome', 'Welcome')],
    feats=[
      ('1.1', 'Logo and tagline', '"Local spots. Local creators." and "Businesses get videos. Creators get paid."', A, '', ''),
      ('1.2', '"I\'m a business" / "I\'m a creator"', 'Demo: signs you in as Crumb & Co. or Renee Park. Real app: goes to Sign in.', A, '', ''),
      ('1.3', '"Demo mode · sample data" label', 'Only shows while the real backend is off.', A, '', ''),
    ]),
  dict(id='signin', n=2, tab=None, title='Sign in and profile setup', blurb='Only appears once the real backend (Supabase) is on, so there is no screenshot from demo mode.',
    shots=[],
    feats=[
      ('2.1', 'Email, then a 6-digit code', 'No passwords. "Use a different email" to go back.', A, '', ''),
      ('2.2', 'Profile setup (first time only)', 'Creator/Business switch, name, @handle, neighborhood, and what you film or type of business.', A, '', ''),
      ('2.3', 'Open to work switch', 'Creators turn it on or off. Changeable later in Settings.', C, 'new', ''),
      ('2.3b', 'Sample videos (creators)', 'Add a few portfolio videos right after sign-up, or skip.', C, 'new', ''),
      ('2.4', 'Goes straight to Verify after setup', '', A, '', ''),
    ]),
  dict(id='verify', n=3, tab=None, title='Verify', blurb='Proves you\'re real. Opened after sign-up, or from Me. Connecting is simulated in demo mode.',
    shots=[('21-verify-creator', 'Creator')],
    feats=[
      ('3.1', 'Connect Instagram', 'Reads @username and follower count. Instagram only allows Creator or Business accounts.', C, '', ''),
      ('3.2', 'Connect TikTok', 'Same as Instagram. Follower count sets suggested rates.', C, '', ''),
      ('3.3', 'Find your Google listing', 'Search by name and city, tap your business, "Change" to pick another.', B, '', ''),
      ('3.4', '"Sign in with Google" to prove ownership', 'Needs Google\'s approval for the Business Profile API before it works for real.', B, '', ''),
      ('3.5', 'Done button', '', A, '', ''),
    ]),
  dict(id='explore', n=4, tab='Tab 1', title='Explore', blurb='One feed for both sides: creator videos plus business job posts, ordered by the ranking in src/data/rank.ts.',
    shots=[('02-explore-business', 'Business (+ to post a job)'), ('13-explore-creator', 'Creator'), ('33-explore-following', 'Bell filter'), ('28-pull-to-refresh', 'Pull to refresh')],
    feats=[
      ('4.0', 'Post a job (+, top right)', 'Opens New job as a sheet. Replaces the old Post tab.', B, 'new', ''),
      ('4.1', 'Search bar', 'Matches captions, names, neighborhoods, niches and business types.', A, '', ''),
      ('4.2', 'Filter: For you / Jobs', '', A, '', ''),
      ('4.3', 'Filter: Collabs', 'Only videos booked through Cloutlet.', A, 'cut', 'The ranking already boosts collabs.'),
      ('4.4', 'Filter: Nearby', 'Within 2 miles of you.', A, 'cut', 'The ranking already puts nearby posts first.'),
      ('4.4b', 'Filter: bell', 'Bell-only chip after Nearby. Shows posts from businesses you turned the bell on for.', C, 'new', ''),
      ('4.5', 'Video tiles', 'Cover image, length, collab partner in a dark see-through pill with a location pin, caption, creator name, and the verified mark (orange check in a small light circle).', A, 'new', ''),
      ('4.6', 'Job tiles', '"Hiring" pill, title, format, budget and perks, business name, over the business photo.', A, '', ''),
      ('4.7', 'Ranking differs by side', 'Creators see more jobs (at least every 4th post). Businesses see more creator videos. Never the same person twice in a row.', A, '', ''),
      ('4.8', 'Creators who are Open to work rank higher', 'Creators with it off still show, just lower.', A, 'new', ''),
      ('4.9', 'Pull down to refresh', 'Orange spinner while you pull, on iPhone, Android and web (on web: drag down, or scroll up past the top). Posts you\'ve already opened move down.', A, 'new', ''),
      ('4.10', 'Tap any tile to open the full-screen viewer', '', A, '', ''),
    ]),
  dict(id='viewer', n=5, tab=None, title='Full-screen viewer', blurb='Opens when you tap a post. Swipe up and down through the feed, like Reels. Demo posts are photos because the sample data has no video files; uploaded videos play.',
    shots=[('03-reel-video-business', 'Video, as a business'), ('14-reel-job-creator', 'Job post, as a creator'), ('23-reel-job-slide2', 'Job post, second photo')],
    feats=[
      ('5.1', 'Swipe to next or previous post', 'Phones: swipe. Web: mouse drag, scroll wheel or arrow keys.', A, '', ''),
      ('5.2', 'Video autoplays and loops', 'Tap to pause or play.', A, '', ''),
      ('5.3', 'Job post photo slideshow', 'Up to 10 of the business\'s photos or videos. Swipe sideways or tap the left/right side. Dots at the top show where you are.', A, 'new', ''),
      ('5.4', 'Job details, bottom left', 'Hiring pill, title, format, "Post by" date, budget and perks.', A, 'new', ''),
      ('5.5', 'Name, verified check, time posted', 'Tap the name to open their profile.', A, '', ''),
      ('5.6', 'Caption (videos)', 'Two lines; tap to expand.', A, '', ''),
      ('5.7', '"Collab with" line', 'Partner\'s small picture and name, no sparkle. Tap to open their profile.', A, 'new', ''),
      ('5.8', 'Like button with count (videos only)', 'Job posts can\'t be liked.', A, '', ''),
      ('5.9', 'Message button (videos only)', 'Only on posts from the other side. Removed from job posts.', A, 'cut', 'Businesses also get "Request collab" below it, so it\'s two ways to reach out.'),
      ('5.10', 'Business rating on job posts', 'Orange star, average and review count from creators who worked with them on Cloutlet (not Google). Tap to read the reviews.', A, 'new', ''),
      ('5.11', 'Save (bookmark)', 'Anyone can save someone else\'s video to reference later. Creators can also save job posts. Kept apart in Saved (Jobs / Videos). Accounts can\'t be saved.', A, 'new', ''),
      ('5.12', 'Profile picture', 'Opens their profile.', A, '', ''),
      ('5.13', 'Full-width orange bar at the bottom', 'See-through orange, edge to edge. "Request collab" for businesses on creator videos; "Message" for creators on job posts.', A, 'new', ''),
      ('5.14', '"Message" on a job opens a ready-to-send message', 'A greeting, the job title, and the pitch the creator wrote (if they have one). Editable before sending. Replaces "Apply".', C, 'new', ''),
      ('5.15', 'Close (×)', '', A, '', ''),
    ]),
  dict(id='profile', n=6, tab='Tab 5', title='Profile', blurb='Anyone\'s profile, exactly as other people see it. The Profile tab opens your own, with a gear for Settings.',
    shots=[('04-profile-creator', 'Creator, seen by a business'), ('22-profile-own', 'Profile tab (your own)'), ('27-profile-business-own', 'Profile tab (business)'), ('15-profile-business', 'Business, bell turned on')],
    feats=[
      ('6.1', 'Top bar: back, @handle, and one button on the right', 'Your own profile: a gear that opens Settings. Creators on a business profile: a bell. Otherwise nothing.', A, 'new', ''),
      ('6.2', 'Bell on business profiles', 'Turn it on to get an update in Inbox › Updates whenever that business posts a job. The bell fills orange and gives a quick shake; no extra text.', C, 'new', ''),
      ('6.3', 'Cover photo', 'Businesses only, when they have one.', A, '', ''),
      ('6.4', 'Picture, name, verified mark, niche or type, neighborhood, bio', '', A, '', ''),
      ('6.5', 'Open to work ring', 'Green ring and a small "OPEN TO WORK" banner on the profile picture, like LinkedIn. Nothing when it\'s off.', A, 'new', ''),
      ('6.6', 'One stats row', 'Creators: Instagram logo + followers, TikTok logo + followers (connected accounts only), collabs on Cloutlet. Businesses: blue star + Google rating with "212 Google reviews" (tap to open their Google reviews), orange star + Cloutlet rating with "11 Cloutlet reviews" (tap to read them), collabs.', A, 'new', ''),
      ('6.7', 'Rates table', 'Suggested price per format from their follower tier. "Open to perks-only deals" when set.', 'Creator profiles', '', ''),
      ('6.8', '"Request collab" and "Message"', 'Business viewing a creator gets both. Creator viewing a business gets Message. Hidden on your own and same-side profiles.', A, '', ''),
      ('6.9', 'Posts grid', 'Their posts plus collabs they\'re tagged in. Tap to open the viewer.', A, '', ''),
    ]),
  dict(id='offer', n=7, tab=None, title='New offer', blurb='A business sends a creator an offer. Opened from "Request collab" on a profile or in the viewer.',
    shots=[('05-request-collab', 'New offer')],
    feats=[
      ('7.1', 'Who it\'s for, and how fast they reply', '', B, '', ''),
      ('7.2', 'Format list with a price for each', 'Instagram Reel, Google Maps video, Story set (3). Picking one fills in its suggested price.', B, '', ''),
      ('7.3', '"Suggested $50 for 2K – 10K followers"', '', B, '', ''),
      ('7.4', 'Price: − / + buttons, or type it', '', B, '', ''),
      ('7.5', 'Perks', '2 pastries, A drink, Lunch for two, Free brunch, A tote bag.', B, '', ''),
      ('7.6', '"Post by" date', 'Free text. Empty means "Flexible".', B, '', ''),
      ('7.7', 'Short note', 'Empty means "Hi Priya! Want to collab?"', B, '', ''),
      ('7.8', 'Total and "Send offer"', 'Opens the chat with the offer pinned.', B, '', ''),
    ]),
  dict(id='chat', n=8, tab=None, title='Chat', blurb='One chat per creator and business pair, with the current offer pinned at the top. Terms are talked through in messages, like a normal professional negotiation; there are no bargaining controls.',
    shots=[('06-chat-offer-sent', 'Business, offer sent'), ('17-chat-creator', 'Creator, offer received'), ('24-chat-pitch-draft', 'Creator, message from a job post')],
    feats=[
      ('8.1', 'Back, their name, profile icon', '', A, '', ''),
      ('8.2', 'Pinned offer card', 'Format, date, price and perks, status: Your move, Waiting, Accepted or Declined.', A, '', ''),
      ('8.3', 'Decline / Accept', 'Creator, when an offer is waiting on them.', C, 'new', ''),
      ('8.4', '"Update offer"', 'Business, while waiting. After agreeing on new terms in the chat, send them as an updated offer. "Send a new offer" after a decline.', B, 'new', ''),
      ('8.5', '"Send an offer" button', 'When there\'s no offer yet.', B, '', ''),
      ('8.6', 'Message history', 'Offers, accepts and declines show as small cards.', A, '', ''),
      ('8.7', 'Message box and send', 'Grows with your text. Comes pre-filled when you tap Message on a job.', A, 'new', ''),
      ('8.8', 'After accepting', 'The card says "Deal done. Share details here." Nothing else happens yet.', A, '', ''),
    ]),
  dict(id='inbox', n=9, tab='Tab 4', title='Inbox', blurb='Offers, messages, and (for creators) Updates: job alerts from businesses you turned the bell on for, in their own channel.',
    shots=[('16-inbox-offers-creator', 'Offers, creator'), ('08-inbox-messages', 'Messages'), ('29-inbox-updates', 'Updates (job alerts)')],
    feats=[
      ('9.1', 'Offers / Messages / Updates switch', 'Updates only shows for creators, with the unread count.', A, 'new', ''),
      ('9.2', 'Offer cards', 'Who, format, date, price, perks, status. Tap the card to open the chat.', A, '', ''),
      ('9.3', 'Message and Accept on the card', 'When an offer is waiting on you. Message opens the chat to talk terms.', C, 'new', ''),
      ('9.5', '"Open chat" when it\'s not your move', '', A, '', ''),
      ('9.6', 'Messages list', 'Picture, name, verified check, time, last message, offer status.', A, '', ''),
      ('9.7', 'Badge on the Inbox tab', 'Offers waiting on you plus unread updates.', A, 'new', ''),
      ('9.7b', 'Updates list', '"Posted a new job: …" with the business, time and format. Orange dot on new ones. Tap to open the job.', C, 'new', ''),
      ('9.8', 'Empty states with a hint', '"Post your work so spots can find you." / "Find a creator in Explore."', A, '', ''),
    ]),
  dict(id='map', n=10, tab='Tab 2', title='Map', blurb='Local businesses near you. Apple Maps on iPhone, Google Maps on Android, OpenStreetMap on web.',
    shots=[('18-map-creator-selected', 'Creator'), ('31-map-zoomed', 'Zoomed in, no spots in view')],
    feats=[
      ('10.1', '"5 spots · 3 hiring" count', 'Follows what\'s on the map: zoom in and it shrinks to match ("1 spot · 0 hiring").', A, 'new', ''),
      ('10.2', 'Map with pins', 'Orange = hiring. Tap a pin to select; tap the map to clear. Centered on your location.', A, '', ''),
      ('10.3', 'List of spots in view, closest first', 'Picture, name, verified check, type, distance, Google rating, Hiring pill.', A, '', ''),
      ('10.4', 'Selected spot opens up', 'Shows the job and a View button to their profile.', A, '', ''),
      ('10.5', 'Message button on a spot', '', C, '', ''),
      ('10.6', 'Whole tab, for businesses', '', B, 'cut', 'A business mostly sees other businesses here. Creators-only, or show creators to businesses?'),
    ]),
  dict(id='post', n=11, tab=None, title='Posting', blurb='There\'s no Post tab. Businesses post jobs from the + on Explore. Creators only add portfolio videos: at sign-up, or in Settings › Portfolio (including videos from Cloutlet collabs).',
    shots=[('10-post-job', 'New job (business)'), ('30-add-video', 'Add a video (creator)')],
    feats=[
      ('11.1', 'New job sheet', 'Title, photos and videos of your space (up to 10, shown as a slideshow; skip it and the cover photo is used), format, budget, perks, post by.', B, 'new', ''),
      ('11.2', 'Add a video', 'Pick a video, caption, and optionally tag a business you closed a deal with on Cloutlet.', C, 'new', ''),
      ('11.3', 'Sample videos at sign-up', 'Same screen, shown once after profile setup, with "Skip for now".', C, 'new', ''),
    ]),
  dict(id='me', n=12, tab=None, title='Settings', blurb='Opened from the gear on your own profile. Everything about your account lives here, and only here.',
    shots=[('20-settings-creator', 'Settings (creator)'), ('34-notifications', 'Notifications'), ('25-saved', 'Saved'), ('21-settings-business', 'Settings (business)')],
    feats=[
      ('12.1', 'Saved (at the top)', 'Creators: Jobs and Videos tabs. Businesses: Videos.', A, 'new', ''),
      ('12.1b', 'Notifications', 'Right under Saved. Lists the businesses you turned the bell on for, each with a switch. Turned-off ones stay in the list until you leave, so you can undo.', C, 'new', ''),
      ('12.2', 'Open to work switch', 'On or off. When on, businesses see you first and your profile picture gets the green ring.', C, 'new', ''),
      ('12.3', 'Your pitch', 'Written by the creator, used in the message when they tap Message on a job. No suggestions; just a tip on what to include (niche, location, audience).', C, 'new', ''),
      ('12.4', 'Portfolio: Add a video', '', C, 'new', ''),
      ('12.5', 'Verification checklist', 'Creators: Instagram, TikTok. Businesses: Google listing, Owner verified. Each row opens Verify.', A, '', ''),
      ('12.6', 'Location switch', 'On asks permission and saves a rough location. Off clears it and stays off on this device. Businesses with a Google listing use its address.', A, 'new', ''),
      ('12.7', 'Sign out', '"Switch side (demo)" in demo mode.', A, '', ''),
    ]),
  dict(id='reviews', n=13, tab=None, title='Cloutlet reviews', blurb='Ratings creators leave for businesses after a deal. Opened from the star on a job post or the Cloutlet rating on a business profile. Format is a first draft for the team to react to.',
    shots=[('32-reviews', 'Cloutlet reviews')],
    feats=[
      ('13.1', 'Business at the top', 'Tap to open their profile.', A, 'new', ''),
      ('13.2', 'Summary', 'Big average, five stars, review count, and a 5-to-1 star breakdown.', A, 'new', ''),
      ('13.3', 'Each review', 'Creator\'s picture and name, their stars, how long ago, which kind of collab, and what they wrote.', A, 'new', ''),
      ('13.4', 'Who can review', 'Only creators who closed a deal with the business. There\'s no screen to leave a review yet.', A, 'new', ''),
    ]),
]

e = html.escape

def who_chip(w):
    cls = 'both' if w == A else 'side'
    return f'<span class="who {cls}">{e(w)}</span>'

def tag(t):
    return {'new': '<span class="tag new">New</span>', 'cut': '<span class="tag cut">Possible cut</span>'}.get(t, '')

def phone(name, cap):
    return (f'<figure class="device"><button type="button" class="frame" data-zoom data-src="{name}" aria-label="Enlarge: {e(cap)}">'
            f'<span class="screen"><img src="{img(name)}" alt="{e(cap)}"></span></button>'
            f'<figcaption>{e(cap)}</figcaption></figure>')

parts = []
toc = []
total = 0
for s in screens:
    total += len(s['feats'])
    toc.append(f'<li><a href="#{s["id"]}"><span class="toc-n">{s["n"]}</span>{e(s["title"])}</a></li>')
    meta = f'Screen {s["n"]}' + (f' · {s["tab"]}' if s['tab'] else '')
    shots = ''.join(phone(n, c) for n, c in s['shots']) or '<p class="noshot">No screenshot: this screen only appears with the real backend turned on.</p>'
    rows = []
    for fid, title, detail, who, t, note in s['feats']:
        d = f'<div class="fdetail">{e(detail)}</div>' if detail else ''
        nt = f'<div class="fnote"><span>Suggestion</span>{e(note)}</div>' if note else ''
        rows.append(f'<tr class="{"is-cut" if t == "cut" else ""}"><td class="fid">{fid}</td><td><div class="ftitle">{e(title)}{tag(t)}</div>{d}{nt}</td><td class="fwho">{who_chip(who)}</td></tr>')
    parts.append(f'''
  <section class="sect" id="{s["id"]}">
    <header class="sect-head">
      <p class="eyebrow">{meta}</p>
      <h2>{e(s["title"])}</h2>
      <p class="blurb">{e(s["blurb"])}</p>
    </header>
    <div class="devices">{shots}</div>
    <div class="table-wrap">
      <table class="feats">
        <thead><tr><th scope="col">#</th><th scope="col">Feature</th><th scope="col">Who sees it</th></tr></thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
    </div>
  </section>''')

cuts = sum(1 for s in screens for f in s['feats'] if f[4] == 'cut')
news = sum(1 for s in screens for f in s['feats'] if f[4] == 'new')

page = f'''<title>Cloutlet Screen Review</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>
/* Layout: clean white product-demo sheet. Sticky top bar, then one section per screen: heading, phone frames in a row, feature table. Single light theme by choice. */
:root {{
  --bg: #FFFFFF;
  --ink: #111111;
  --ink-2: #555555;
  --ink-3: #8A8A8A;
  --line: #ECECEC;
  --soft: #F6F6F6;
  --accent: #EA5A0C;
  --accent-soft: #FFF1E8;
  --green: #12805C;
  --green-soft: #E8F6F0;
  --sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color-scheme: light;
}}
* {{ box-sizing: border-box; }}
html {{ background: var(--bg); }}
body {{ background: var(--bg); color: var(--ink); font-family: var(--sans); font-size: 15px; line-height: 1.55; -webkit-font-smoothing: antialiased; }}
h1, h2 {{ margin: 0; font-weight: 700; letter-spacing: -0.025em; text-wrap: balance; }}
p {{ margin: 0; }}
:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }}
.container {{ max-width: 1080px; margin: 0 auto; padding-left: max(24px, env(safe-area-inset-left, 0px)); padding-right: max(24px, env(safe-area-inset-right, 0px)); }}

body::before {{ content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 30; background: var(--bg); }}
.topbar {{ position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: rgba(255,255,255,0.92); backdrop-filter: saturate(180%) blur(12px); border-bottom: 1px solid var(--line); }}
.topbar .container {{ display: flex; align-items: center; gap: 20px; height: 56px; }}
.brand {{ display: flex; align-items: center; gap: 8px; font-weight: 700; letter-spacing: -0.02em; white-space: nowrap; }}
.brand i {{ width: 10px; height: 10px; border-radius: 50%; background: var(--accent); display: inline-block; }}
.toc {{ flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }}
.toc::-webkit-scrollbar {{ display: none; }}
.toc ol {{ list-style: none; margin: 0; padding: 0; display: flex; gap: 2px; }}
.toc a {{ display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; color: var(--ink-2); text-decoration: none; font-size: 13px; font-weight: 500; white-space: nowrap; }}
.toc a:hover {{ background: var(--soft); color: var(--ink); }}
.toc-n {{ font-size: 11px; color: var(--ink-3); font-variant-numeric: tabular-nums; }}

.hero {{ padding-block: 72px 56px; border-bottom: 1px solid var(--line); }}
.hero .eyebrow {{ margin-bottom: 14px; }}
.hero h1 {{ font-size: clamp(36px, 6vw, 56px); line-height: 1.04; max-width: 14ch; }}
.hero .lede {{ margin-top: 18px; font-size: 18px; color: var(--ink-2); max-width: 60ch; }}
.stats {{ display: flex; flex-wrap: wrap; gap: 12px 40px; margin-top: 36px; }}
.stat b {{ display: block; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }}
.stat span {{ font-size: 13px; color: var(--ink-3); }}
.legend {{ display: flex; flex-wrap: wrap; gap: 10px 24px; margin-top: 32px; font-size: 13px; color: var(--ink-2); }}
.legend > span {{ display: inline-flex; align-items: center; gap: 8px; }}

.eyebrow {{ font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }}

.sect {{ padding-block: 72px; border-bottom: 1px solid var(--line); scroll-margin-top: 64px; display: grid; gap: 36px; }}
.sect-head {{ display: grid; gap: 8px; max-width: 68ch; }}
.sect-head h2 {{ font-size: 32px; line-height: 1.15; }}
.blurb {{ color: var(--ink-2); font-size: 16px; }}

.devices {{ display: flex; flex-wrap: wrap; gap: 32px; padding: 40px 32px; background: var(--soft); border-radius: 20px; justify-content: center; }}
.device {{ margin: 0; display: grid; gap: 12px; justify-items: center; width: 232px; max-width: 100%; }}
.frame {{ all: unset; cursor: zoom-in; display: block; width: 100%; padding: 7px; border-radius: 38px; background: #0E0E0E; box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 18px 40px -12px rgba(0,0,0,0.28); transition: transform .2s ease, box-shadow .2s ease; }}
.frame:hover {{ transform: translateY(-3px); box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 26px 50px -14px rgba(0,0,0,0.32); }}
.frame:focus-visible {{ outline: 3px solid var(--accent); outline-offset: 4px; }}
.screen {{ display: block; aspect-ratio: 390 / 844; max-width: 100%; border-radius: 31px; overflow: hidden auto; background: #fff; scrollbar-width: none; }}
.screen::-webkit-scrollbar {{ display: none; }}
.screen img {{ display: block; width: 100%; height: auto; }}
.device figcaption {{ font-size: 13px; font-weight: 500; color: var(--ink-2); text-align: center; }}
.noshot {{ color: var(--ink-3); font-size: 14px; padding: 24px; text-align: center; max-width: 340px; }}

.table-wrap {{ overflow-x: auto; }}
.feats {{ width: 100%; border-collapse: collapse; font-size: 14.5px; }}
.feats th {{ text-align: left; font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; padding: 0 12px 10px; border-bottom: 1px solid var(--ink); }}
.feats td {{ padding: 14px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }}
.feats th:first-child, .feats td:first-child {{ padding-left: 0; }}
.feats th:last-child, .feats td:last-child {{ padding-right: 0; text-align: right; }}
.fid {{ width: 56px; color: var(--ink-3); font-weight: 600; font-variant-numeric: tabular-nums; }}
.ftitle {{ font-weight: 600; }}
.fdetail {{ color: var(--ink-2); margin-top: 2px; max-width: 70ch; }}
.fnote {{ margin-top: 8px; font-size: 13.5px; color: var(--ink); display: flex; gap: 8px; align-items: baseline; }}
.fnote span {{ flex: none; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent); }}
.fwho {{ width: 1%; white-space: nowrap; }}
.who {{ display: inline-block; font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink-2); background: #fff; }}
.who.side {{ border-color: var(--ink); color: var(--ink); }}
.tag {{ display: inline-block; margin-left: 8px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; vertical-align: 2px; }}
.tag.new {{ background: var(--green-soft); color: var(--green); }}
.tag.cut {{ background: var(--accent-soft); color: var(--accent); }}

.closing {{ padding-block: 72px 96px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 24px; }}
.panel {{ border: 1px solid var(--line); border-radius: 20px; padding: 28px; display: grid; gap: 14px; align-content: start; }}
.panel h2 {{ font-size: 22px; }}
.panel ul {{ margin: 0; padding-left: 18px; display: grid; gap: 10px; color: var(--ink-2); }}
.panel li b {{ color: var(--ink); font-weight: 600; }}
footer {{ border-top: 1px solid var(--line); padding-block: 24px; font-size: 13px; color: var(--ink-3); }}

dialog {{ border: 0; padding: 0; background: transparent; max-width: min(94vw, 460px); max-height: 94vh; overflow: visible; }}
dialog::backdrop {{ background: rgba(255,255,255,0.86); backdrop-filter: blur(6px); }}
.zoom-frame {{ padding: 9px; border-radius: 46px; background: #0E0E0E; box-shadow: 0 30px 80px -20px rgba(0,0,0,0.4); }}
.zoom-screen {{ border-radius: 38px; overflow: hidden auto; max-height: calc(92vh - 70px); aspect-ratio: 390 / 844; background: #fff; scrollbar-width: none; }}
.zoom-screen img {{ display: block; width: 100%; height: auto; }}
dialog form {{ text-align: center; margin-top: 14px; }}
dialog button {{ font: 600 14px var(--sans); color: var(--ink); background: #fff; border: 1px solid var(--line); border-radius: 999px; padding: 9px 22px; cursor: pointer; }}

@media (max-width: 720px) {{
  .hero {{ padding-block: 48px 40px; }}
  .sect {{ padding-block: 48px; gap: 28px; }}
  .devices {{ padding: 24px 12px; gap: 20px; }}
  .device {{ width: calc(50% - 10px); }}
  .frame {{ padding: 5px; border-radius: 28px; }}
  .screen {{ border-radius: 23px; }}
  .feats td {{ padding: 12px 8px; }}
  .fid {{ width: 44px; }}
  .brand span {{ display: none; }}
}}
@media (prefers-reduced-motion: reduce) {{ .frame {{ transition: none; }} .frame:hover {{ transform: none; }} }}
@media (prefers-reduced-motion: no-preference) {{ html {{ scroll-behavior: smooth; }} }}
</style>

<div class="topbar">
  <div class="container">
    <div class="brand"><i></i>Cloutlet <span>· Screen review</span></div>
    <nav class="toc" aria-label="Screens"><ol>{"".join(toc)}<li><a href="#notes">Notes</a></li></ol></nav>
  </div>
</div>

<main>
  <div class="container">
    <header class="hero">
      <p class="eyebrow">Product review · Round 7 · Nov 22, 2026</p>
      <h1>Cloutlet screen review</h1>
      <p class="lede">Every screen in the app and every feature on it, numbered so the team can say "keep 6.4" or "cut 4.3". Screenshots come from the app running on sample data. Tap a phone to enlarge it; tall screens scroll inside the frame.</p>
      <div class="stats">
        <div class="stat"><b>{len(screens)}</b><span>screens</span></div>
        <div class="stat"><b>{total}</b><span>features</span></div>
        <div class="stat"><b>{news}</b><span>new or changed</span></div>
        <div class="stat"><b>{cuts}</b><span>suggested cuts</span></div>
      </div>
      <div class="legend">
        <span><span class="who both">Both</span> creators and businesses</span>
        <span><span class="who side">Business</span> or <span class="who side">Creator</span> one side only</span>
        <span><span class="tag new" style="margin:0">New</span> added this week</span>
        <span><span class="tag cut" style="margin:0">Possible cut</span> suggestion for discussion</span>
      </div>
    </header>
    {"".join(parts)}
    <section class="closing" id="notes">
      <div class="panel">
        <p class="eyebrow">Gaps</p>
        <h2>Not built yet</h2>
        <ul>
          <li><b>Payments.</b> Nothing moves money. After "Accept" the chat just says "Deal done."</li>
          <li><b>After the deal.</b> No "delivered" or "posted" step, no reviews, nothing if a creator never posts.</li>
          <li><b>Editing your profile.</b> No way to change bio, picture or cover photo after sign-up.</li>
          <li><b>Deleting a post.</b></li>
          <li><b>Phone notifications.</b> Job updates and offers show inside the app (Inbox), but don't buzz your phone yet.</li>
          <li><b>Reporting and blocking.</b></li>
          <li><b>Leaving a rating.</b> Ratings are stored and shown, but there's no screen to leave one after a deal yet.</li>
        </ul>
      </div>
      <div class="panel">
        <p class="eyebrow">How it works</p>
        <h2>Location</h2>
        <ul>
          <li>The app asks for location permission the first time you open it after signing in.</li>
          <li>If allowed, it saves a rough location (within about half a mile) on your profile and refreshes it each time you open the app.</li>
          <li>It drives "Nearby", Map distances and the ranking boost for close posts.</li>
          <li>Businesses with a verified Google listing are never asked; their address is used.</li>
          <li>Demo mode: more than 30 miles from Seattle, the sample location is kept so the demo still has spots nearby.</li>
        </ul>
      </div>
    </section>
  </div>
</main>
<footer><div class="container">Cloutlet · Expo SDK 58 · screenshots from the web build in demo mode</div></footer>

<dialog id="zoom" aria-label="Enlarged screenshot">
  <div class="zoom-frame"><div class="zoom-screen"><img id="zoom-img" alt=""></div></div>
  <form method="dialog"><button type="submit">Close</button></form>
</dialog>

<script>
(function () {{
  var dlg = document.getElementById('zoom');
  var big = document.getElementById('zoom-img');
  document.querySelectorAll('[data-zoom]').forEach(function (btn) {{
    btn.addEventListener('click', function () {{
      var src = btn.querySelector('img');
      big.src = src.src; big.alt = src.alt;
      if (dlg.showModal) {{ dlg.showModal(); dlg.querySelector('.zoom-screen').scrollTop = 0; }}
    }});
  }});
  dlg.addEventListener('click', function (e) {{ if (e.target === dlg) dlg.close(); }});
}})();
</script>
'''

with open(OUT, 'w') as f:
    f.write(page)
print('wrote', OUT, round(os.path.getsize(OUT) / 1e6, 2), 'MB', total, 'features', cuts, 'cuts', news, 'new')
