# Cloutlet team requests

A running list of what the team has asked for, round by round, and where each stands.
Review page: `docs/screen-review/index.html` (rebuild with `docs/screen-review/build.py`).

## Round 1 (Nov 22, 2026)

- [x] Full-screen viewer scrolls on web (mouse drag, wheel, arrow keys)
- [x] Web map uses OpenStreetMap (no Google key, no billing)
- [x] Profile social accounts as vertical tiles, side by side
- [x] Ask for location permission and save a rough location
- [x] Screen review page with screenshots and every feature listed

## Round 2 (Nov 22, 2026)

- [x] Creator status like LinkedIn: Open to work / Open to network / Not looking
  - Set at sign-up, changed any time from your own profile
  - Ranking boosts Open to work; Not looking still shows, just lower
- [x] Everything in miles (Nearby = 2 mi, distances, location rounding)
- [x] 4.5 Verified badge: plain orange check, no circle (everywhere)
- [x] 4.5 Collab pill: dark see-through with white text, location pin instead of ×
- [x] 4.9 Pull to refresh: orange spinner (iPhone and Android; web has no pull-to-refresh)
- [x] 5.13 Bottom button: full-width see-through orange bar, no side margins
- [x] 5.7 Collab tag: "Collab with" + partner's picture and name, no sparkle
- [x] Job posts: removed Message and Like; added Save (bookmark) and the business's Cloutlet rating
- [x] "Apply" is now "Message", opening a pre-filled message (greeting, job, pitch, rate)
- [x] Creator pitch on their profile, with three suggestions written from their profile
- [x] Job posts: businesses upload up to 10 photos/videos, shown as a swipeable slideshow
- [x] Saved jobs screen (from Me)

### Open questions from round 2
- How do ratings get left? Storage is ready (one review per person per accepted deal); needs a screen.
- AI-written pitches: possible later, but costs money per message (an AI API). Suggestions are free templates for now.
- Should businesses also get Save, or only creators?

## Round 3 (Nov 22, 2026)

- [x] Profile stats in one row: Instagram logo + followers, TikTok logo + followers, collabs on Cloutlet
  - Removed the orange boxes, the @handles, engagement and the total-followers number
  - Businesses: Google rating, Cloutlet rating, collabs
- [x] Verified mark everywhere: orange check inside a small light circle (no filled orange dot)
- [x] "Open to work" is a small green badge next to the name
- [x] ~~Businesses can save creators~~ (replaced in round 4: no saving accounts)
- [x] ~~Saved section on your own profile~~ (moved to Settings in round 4)

## Round 4 (Nov 22, 2026)

- [x] Profile tab opens your own profile, exactly as others see it, with a gear for Settings
- [x] Settings (the old Me page) holds everything about your account, only there:
  status (Open to work), pitch, verification, Saved, location, sign out
- [x] Each feature lives in one place (Saved is only in Settings; status/pitch removed from your profile)
- [x] Pull to refresh works on web (drag down, or scroll up past the top) with the orange spinner
- [x] Save individual posts: anyone can save a video for reference; creators can also save job posts
  - Saved has Jobs and Videos tabs (businesses: Videos)
  - Removed saving accounts
- [x] Bell on business profiles (creators): get an update when that business posts a job
  - Updates arrive in Inbox › Updates, a separate channel from Messages (like a company newsletter on LinkedIn)
  - Inbox badge counts unread updates

### Open questions from round 4
- Phone push notifications for job updates? (Needs expo-notifications and a development build; free.)
- Should the bell also notify about a business's new videos, or jobs only?

## Round 5 (Nov 22, 2026)

- [x] Open to work: no text badge; LinkedIn-style green ring + small "OPEN TO WORK" banner on the profile picture
- [x] Status is a single on/off switch ("Open to network" removed)
- [x] No Post tab for anyone
  - Businesses: + on the top right of Explore opens New job (jobs only; photos/videos go in the job's slideshow)
  - Creators: add portfolio videos at sign-up (skippable) or in Settings › Portfolio, incl. videos from Cloutlet collabs
- [x] Settings: Saved moved to the top; Location is a simple switch (off clears your location and stays off on the device)
- [x] Map: "spots · hiring" count and the list follow what's on screen as you zoom/pan
- [x] Bell: no explanation text; it fills orange and shakes when turned on
- [x] DMs: no bargaining controls. Creators Accept/Decline; terms are talked through in messages;
      business taps "Update offer" to send agreed terms (Counter and Negotiate removed)

## Round 6 (Nov 22, 2026)

- [x] Pitch: creators write their own. No suggestions and nothing written for them; just a tip on what to include
- [x] Message on a job: greeting + job title + their own pitch (rate line removed)
- [x] Business profile ratings: blue star + "212 Google reviews", orange star + "11 Cloutlet reviews" (no Google G logo)
- [x] Tap Google reviews: opens the business on Google Maps in an in-app browser (free; no Google API)
- [x] Tap Cloutlet reviews (profile, or the star on a job post): new Cloutlet reviews page (first-draft format)

### Open questions from round 6
- When and how do creators leave a review? (Suggest: prompt both sides after the deal is marked done.)
- Should businesses also review creators, shown on creator profiles?

## Round 7 (Nov 22, 2026)

- [x] Explore: bell chip after Nearby (creators) shows posts from businesses you turned the bell on for
- [x] Settings › Notifications (under Saved): businesses you get job updates from, with a switch for each

## Round 8 (Nov 22, 2026)

- [x] Hiring pill: see-through orange, no icon (feed and full-screen job post)
- [x] Businesses: default collab message in Settings; pre-fills Request collab ("Hi Priya! …")
- [x] Creators: Services you offer (switch per format, at least one on); profile rates and offers only show those
- [x] Chat: offer note shows as a normal message bubble; offer events are a small grey line with the terms
- [x] Chat message box grows with the text and shrinks back
