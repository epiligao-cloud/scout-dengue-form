# SCOUT Dengue Case Form — hosted offline copy (Stage 2)

This folder is a self-contained, installable copy of DengueCaseForm.html that
works without a signal, for BHWs who currently can't even open the Apps
Script version. It sends completed cases to the SAME live Google Sheet as
before, through a new `doPost()` endpoint on your existing deployment.

Files:
- index.html            — the form itself (this is what people open)
- manifest.json, icon.svg — makes it installable to a phone's home screen
- service-worker.js      — caches the app so it opens with no signal
- vendor/                — Leaflet + the address search, bundled locally
                           (no more unpkg.com dependency)

## Prerequisites (do these first, in this order)

1. Apply `server_patch_Code.gs` (submitDengueCase with the Submission ID
   column and APP_STATUS.environment routing) if you haven't already.
2. Apply `server_patch_doPost.gs` (adds the doPost() endpoint).
3. In the Apps Script editor: Project Settings → Script Properties → add
       FORM_ACCESS_CODE = <a long random string or phrase, 20+ characters>
   Write this down somewhere safe (e.g. a password manager) — you'll need
   to give it to your BHWs once, and again to anyone who joins later.

   IMPORTANT: the code must also be baked into index.html as a scrambled
   (hashed) value, so phones can check it instantly without ever asking the
   server -- this is what makes typing the code feel instant instead of a
   10-20 second wait. If you ever change FORM_ACCESS_CODE, you must also
   update index.html to match, or phones will open locally with the OLD
   code but fail every real submission against the NEW one on the server.

   Note: there is currently no automatic way to revoke ONE specific lost or
   compromised phone -- a phone keeps opening locally with whatever code it
   already has until you change the code everywhere (which then blocks that
   phone's real submissions, but the phone itself will just look "stuck,"
   not clearly told to re-enter). If cutting off a specific phone quickly
   ever becomes something you need, that would be a feature to add later,
   not something built into this version.
   To generate the matching hash for a new code, run this once (Python 3):

       python3 -c "import hashlib; print(hashlib.sha256(('scout-dengue-form-v1-salt-9f3k2' + 'YOUR-NEW-CODE-HERE').encode()).hexdigest())"

   Then paste the result into index.html as ACCESS_CODE_HASH (search for
   that name), keeping ACCESS_CODE_SALT exactly as it already is.
4. Deploy → Manage deployments → pencil icon → Version: "New version" →
   Deploy. Copy the /exec URL shown there.
5. Add the "Submission ID" header to BOTH the "Dengue" and "Dengue_Demo"
   sheets if you haven't already (server_patch_Code.gs will not create it).

## One edit to this folder before publishing

Open `index.html`, find this line (search for APPS_SCRIPT_URL):

    const APPS_SCRIPT_URL = 'PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE';

Replace the placeholder with the /exec URL from step 4 above. Keep the
quotes. Nothing else in this folder needs editing for a normal setup.

## Publishing to GitHub Pages (free, no domain needed)

1. Sign in to (or create) a GitHub account under epiligao@gmail.com.
2. Create a new PUBLIC repository, e.g. named `scout-dengue-form`.
   (Public is required for free GitHub Pages hosting. This repo holds only
   the form's code, the barangay boundaries, and the logo — no patient
   data ever lives here.)
3. Upload every file in this folder to that repository (drag-and-drop
   through the GitHub website works fine, or use git if you're comfortable
   with it) — keep the `vendor/` folder structure exactly as-is.
4. Repository → Settings → Pages → under "Build and deployment", set
   Source: "Deploy from a branch", Branch: main (or master) / root → Save.
5. GitHub will show a URL like:
       https://epiligao.github.io/scout-dengue-form/
   Wait a minute or two after the first save, then open it.

## First-time setup on each BHW's phone

There are two ways to enter the access code — pick whichever is easier for
your team. Both end up in the same place: the code gets remembered on that
phone, and typing/scanning is only needed once.

**Option A — type it once.** Open the GitHub Pages URL above in Chrome
(recommended over other browsers for reliability) and type the access code
when asked.

**Option B — share a link or QR code (no typing).** Add the code to the end
of your GitHub Pages URL like this:

    https://epiligao.github.io/scout-dengue-form/?code=YOUR-ACCESS-CODE

Send that full link to the BHW (SMS, Messenger, etc.) and they just tap it —
the code fills in and is checked automatically. To turn that link into a
scannable QR code, paste it into any free QR generator (e.g. search "QR
code generator" and paste the link in) and share the image or print it;
the BHW scans it with their phone camera. The code briefly shows in the
browser address bar right after tapping/scanning, then the page removes it
automatically so it doesn't stay in the phone's browsing history.

Both options need a real connection the first time, to confirm the code is
valid; after that, it keeps working offline on that phone.

3. Tap the browser menu → "Add to Home Screen" / "Install app". This is
   what makes it open later without needing to type the URL or have
   signal.
4. Test it once, right there: submit a test case with the phone in
   airplane mode, confirm the small badge on the left edge shows "1 case
   saved, not yet sent," then turn the connection back on and confirm it
   sends.

## Updating the form later

**Publishing an update (you):**
1. Unzip the new zip and upload EVERYTHING in it to the GitHub repository,
   overwriting the old files (drag the whole contents in, including the
   `vendor` folder). Uploading every file is the safe habit: the app works out
   by itself that something changed, so nothing has to be bumped by hand.
2. That's it. Phones pick it up on their own (below).

**What a BHW's phone does:**
1. The next time the app is opened with a connection (or brought back to the
   screen after a while), it quietly downloads the new version in the background.
2. A dark bar appears at the top: **"A new version is ready" — Update now / Later**.
3. Tapping **Update now** reloads the app on the new version. Saved cases waiting
   to send, unfinished drafts, and the access code are NOT touched. If they were
   mid-form, the unfinished-case popup offers to resume it.
4. If the download fails part-way (weak signal), nothing changes: the phone
   keeps running the old, working version and can try again later.

**Checking which version a phone has:** the bottom of the form (and the access-
code screen) shows e.g. `Version v16 · 9e36ba`. Ask a BHW to read it out. The
**Check for updates** link next to it looks for a new version right away.

**When you change what the server accepts** (for example, which fields are
required): also raise FORM_VERSION in index.html and OFFLINE_MIN_FORM_VERSION
in the Apps Script (server_patch_doPost.gs) together. Phones still on an older
version then can't send cases (they stay safely queued), the queue panel says
the form is out of date, and the app goes looking for the update by itself.

**Never ask BHWs to "clear the cache" or "clear site data".** On a phone that
also erases cases that haven't sent yet, drafts, and the access code. The
Update bar and Check for updates link exist so they never need to.

## Known limits (carried over from earlier discussion)

- The map's satellite/street tiles still need a connection to load — GPS
  capture and manual pin placement work offline, but the background
  imagery will look blank until the phone is back online. An offline map
  background is a possible Stage 3 addition, not built here.
- Each phone needs one online visit to install and one online visit to
  pick up any later update.
- If a BHW's phone is lost or reset before its queued cases send, use
  "Copy backup" in the queue panel beforehand where possible — see the
  earlier discussion about a CHO-side paste-back tool for recovering a
  backup that only exists as a forwarded message.
