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
       FORM_ACCESS_CODE = <a long random string, 20+ characters>
   Write this down somewhere safe (e.g. a password manager) — you'll need
   to give it to your BHWs once, and again to anyone who joins later.
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

1. Change files in this folder as needed.
2. If you changed anything that makes an OLD copy on a phone unsafe to
   keep accepting (e.g. you changed which fields are required), bump
   FORM_VERSION in index.html AND OFFLINE_MIN_FORM_VERSION in
   server_patch_doPost.gs, and deploy both together.
3. Also bump CACHE_NAME in service-worker.js (e.g. 'scout-dengue-form-v2')
   whenever any file changes, or phones may keep serving a stale cached
   copy even after you republish.
4. Upload the changed files to the same GitHub repository. Each phone
   picks up the update the next time it opens the app WITH a connection.

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
