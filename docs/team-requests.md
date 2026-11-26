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

## Round 9 (Nov 25, 2026)

- [x] Explore order changes between app opens: opened posts go down (fades over a few days), last visit's top 6 go down a little,
      plus a small per-session shuffle (new on pull-to-refresh). Remembered on the device only. Weights in `src/data/rank.ts`
- [x] Creator opening a business from a post, profile or the map: no Accept/Decline. If that business has an open offer,
      a note says "This business has already sent you an offer. Check your inbox." (on their profile and in the chat)
- [x] Inbox offers: only "Open chat". Nothing is accepted from the list
- [x] Deals in chat, three steps: business sends an offer → creator taps Accept terms → business taps Confirm deal.
      The pinned card says Proposed terms / Agreed terms · not confirmed yet / Confirmed deal. Messaging never accepts anything
- [ ] Live mode: run the new migration `supabase/migrations/20261125000000_confirm_offer.sql`

### Open questions from round 9
- Should creators be able to propose terms too? (Backend supports either side; only businesses have the button.)
- "Update offer" creates a new offer; the old one stays open in the Inbox. Replace it instead?
- Business onboarding / explaining influencer marketing: covered in the pitch for now; in-app education later

## Round 10 (Nov 25, 2026)

- [x] Hiring posts: title, description (up to 2,000 characters), format, how many (1–20), pay per creator
      (price or open to offers, preset or custom perks), optional deadline (date picker), timeframe and creators to hire
- [x] Business can edit its job posts (Your posts on its profile › Manage post › Edit)
- [x] Creator-facing post: summary line, hiring count, two lines of description + "More" opens a details sheet
- [x] "Apply" replaces "Message" on job posts. Apply screen with a default message to review; only Send counts.
      Applied posts show "Applied · Open chat"; chats show "Applied · <post>" and the inbox says "You applied"
- [x] Chats are only created when the first message is sent (opening a chat or the Apply screen creates nothing)
- [x] Business inbox: Sent offers · Applicants (by post) · Messages (All / per post / Casual)
- [x] Conversation labels from real events only: Applied, Offer sent / New offer, Confirm deal / Waiting to confirm, Deal · in progress, Declined
- [x] Business sends an offer from any chat (a casual one included); starts from the post's terms if they applied.
      "Update offer" changes the same offer (no duplicates); the creator accepts the new terms again
- [x] Manage post: real application count; views and opens shown as "Not tracked yet"
- [x] Tests: `npm test` (jest-expo), the hiring flows against the demo backend
- [ ] Live mode: run migration `supabase/migrations/20261126000000_jobs_applications.sql`
- [ ] Measure post views / opens (needs a `post_events` table and a server function)

### Decided this round
- Creators to hire: optional, editable later. Deadline: a real date. Creators negotiate by message (no structured counteroffer).
- Declined offers keep the chat. No "Done" label until there's a "mark collab complete" action.
- Taps on Apply without sending are not recorded. Creators see "3+ applied" style counts; businesses see exact numbers.

### Open questions from round 10
- "Done": add a "mark collab complete" step (and is that where reviews get asked for)?
- A "Post" (feed photo) format: needs a new format and creator rates
- Close / archive a job post when it's filled?

## Round 11 (Nov 25, 2026)

- [x] New job form: title → pay per creator → what each creator makes (format + count) → details → deadline → photos;
      timeframe and creators to hire under "More options". Errors show under the field, with the fix
- [x] Pay always reads "per creator"; with 2+ hires the form says each gets it (not split)
- [x] Business inbox: Messages (All · Applicants · Casual) and Sent offers. Applicants: newest first, filter by job and follower size
- [x] Status pills have their own colours (Applied blue, Offer sent outlined, needs-you solid orange, Deal green, Declined faded)
- [x] Chat path A (applied): post terms pinned; business proposes them or changes them first. No default message
- [x] Chat path B (casual): Offer button next to the message box; review step; individual terms only; no message
- [x] "Update offer" fixed: it now changes the offer in place inside the chat (it used to open a second copy of the chat,
      and could silently switch the format)
- [x] Every version of the terms stays in the chat as a grey line with the full terms
- [x] Profile: "Active jobs" (3 newest) + View all; jobs list with Active / Archived; Archive / Reopen in Manage post
- [x] Views tracked for real (once per person per day, in the full-screen viewer); "opened in full screen" removed
- [ ] Live mode: run migration `supabase/migrations/20261127000000_offer_terms_archive_views.sql`

## Round 12 (Nov 25, 2026)

- [x] Business inbox: "Sent offers" is now "Requested collabs"; the "Casual" filter is now "DMs"
- [x] Offers and updated terms in chat show as a small terms card (label, which post, deliverables, price, perks, due date)
      instead of one long grey line. Accepted / Confirmed / Declined stay short pills
