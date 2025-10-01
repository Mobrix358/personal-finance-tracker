Personal Finance Tracker — PWA Pack
====================================
Files in this folder:
- manifest.json
- sw.js
- /icons/icon-192.png
- /icons/icon-512.png

How to install as an app (Android Chrome):
1) Put these files next to your index.html (same folder).
2) Open index.html via HTTPS or a local web server (not file://).
   - Example: Host the folder with any simple local server app or upload to GitHub Pages/Netlify.
3) Make sure 'Desktop site' is OFF in Chrome.
4) Reload the page. You'll see an Install button in the header, or use Chrome menu → Install app.

Notes:
- Your data stays local in the browser (localStorage). Export/Import JSON/CSV for backups.
- Service worker (sw.js) enables offline once the app is loaded once.
