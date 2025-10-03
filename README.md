# Finance Tracker PWA

This folder contains everything you need to deploy your Finance Tracker as an installable Progressive Web App (PWA) on GitHub Pages.

## Files included
- `index.html` — your original UI with PWA hooks added
- `pwa.js` — registers the service worker and controls the install banner
- `sw.js` — service worker with offline caching (app shell + stale-while-revalidate)
- `manifest.json` — PWA manifest with app name, theme colours, and icons
- `icons/` — app icons (192, 512, 180 for Apple touch icon)

> Note: Keep your existing app logic in `app.js`. This package does **not** modify it; it only adds PWA support alongside it.

## How to deploy via GitHub Pages
1. **Create a new repo** (or use an existing one), e.g., `finance-tracker`.
2. Copy the contents of this folder to the root of that repo, including the `icons/` folder.
3. Add your existing `app.js` to the repo root if it is not already there.
4. Commit and push.
5. In your repo settings, go to **Pages** and set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`) and **/root**
6. Wait for Pages to build. Your site will be available at:
   - `https://<your-username>.github.io/finance-tracker/` (if not using the special `<username>.github.io` repo).

## Installing the app
- **Android/Chrome/Edge**: visit your site, you should see a custom "Install Finance Tracker" banner. Tap **Install**.
- **Desktop Chrome/Edge**: look for the "Install" icon in the address bar, or open the Chrome menu > `Install app`.
- **iOS/Safari**: tap **Share** > **Add to Home Screen**. (iOS doesn't support the install prompt event.)

## Updating the app
- After changing any core files, bump the cache version string in `sw.js` (`CACHE_NAME`) and push again. Users will get the new version after a refresh.
- Optional: You can also automate cache busting by embedding a hash in `CACHE_NAME` at build time.

## Folder structure (recommended)
```
/ (repo root)
  index.html
  app.js             <-- your existing app logic (if not already in this repo)
  pwa.js
  sw.js
  manifest.json
  /icons
    icon-192.png
    icon-512.png
    icon-180.png
```

## Troubleshooting
- **Install banner not showing on Android**: You must visit over HTTPS (GitHub Pages is HTTPS), and `manifest.json` + `sw.js` must be reachable. Also, visit the site at least once before the browser considers it installable.
- **Offline not working**: Open DevTools > Application > Service Workers and check that the service worker is `activated`. Confirm `manifest.json` and icons are loading without 404s.
- **Updates not appearing**: Bump `CACHE_NAME` in `sw.js`, then hard refresh (Ctrl/Cmd+Shift+R).

---

Built on 2025-10-03 18:33:48 UTC.
