# NEBULA — Premium Video Library

A lightweight video-link library with a premium gradient UI, a hidden seven-click admin entry, and Cloudflare Pages Functions + D1.

## Features
- Responsive dark gradient interface.
- Search videos by title.
- YouTube, Vimeo and direct video URL playback.
- Hidden admin access: click the tiny bottom-right corner 7 times within 2.2 seconds.
- Password-protected admin panel.
- Add videos using only a title and link; delete existing videos.
- D1 stores video records persistently.

## Deploy to Cloudflare Pages

### 1. Create a D1 database
In the Cloudflare dashboard, open **Workers & Pages → D1 SQL Database → Create database**. Name it `nebula-videos`.

Or with Wrangler:
```bash
npx wrangler d1 create nebula-videos
```

Copy the database ID and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.toml`.

### 2. Apply the database migration
```bash
npx wrangler d1 migrations apply nebula-videos --remote
```
For local development:
```bash
npx wrangler d1 migrations apply nebula-videos --local
```

### 3. Set admin secrets
In Cloudflare dashboard → **Workers & Pages → your Pages project → Settings → Variables and Secrets**, add these as encrypted secrets:
- `ADMIN_PASSWORD`: choose a strong admin password.
- `ADMIN_SECRET`: a separate random secret, at least 32 characters.

Generate a secret locally with:
```bash
openssl rand -hex 32
```
Do not commit secrets or put them in frontend JavaScript.

### 4. Deploy from GitHub
1. Push this project to a GitHub repository.
2. Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git.
3. Select the repository.
4. Framework preset: **None**.
5. Build command: leave empty.
6. Build output directory: `/` (or `.` if the dashboard requires a relative path).
7. Add the D1 binding named **DB** in Pages project Settings → Functions → D1 database bindings. Select the `nebula-videos` database.
8. Add `ADMIN_PASSWORD` and `ADMIN_SECRET` as encrypted secrets in the Pages project settings.
9. Deploy.

The D1 binding name must be exactly `DB`, matching `env.DB` in the Functions.

### 5. Test
- Open the deployed site.
- Click the very bottom-right corner 7 times quickly to open admin login.
- Sign in using `ADMIN_PASSWORD`.
- Enter a video title and a shareable video URL, then submit.
- The video appears on the homepage and remains after refresh.

## Local development
```bash
npm install
npx wrangler pages dev .
```
Create a `.dev.vars` file locally (never commit it):
```dotenv
ADMIN_PASSWORD="choose-a-local-password"
ADMIN_SECRET="replace-with-a-long-random-secret"
```
Ensure your local D1 database has the migration applied.

## Supported links
- YouTube watch/share links are embedded using the privacy-enhanced YouTube player.
- Vimeo links are embedded when a Vimeo video ID is present.
- Other `http(s)` links are treated as direct video file URLs and played with the browser's HTML5 player. A normal webpage URL is not necessarily a playable video URL.

## Security notes
- The seven-click gesture is only a hidden entry point, not a security measure.
- Admin actions are checked server-side using a signed, HttpOnly, Secure, SameSite=Strict cookie.
- Sessions expire after 8 hours.
- Use HTTPS (Cloudflare Pages provides it).
- Use a strong unique admin password and keep `ADMIN_SECRET` private.
- Consider adding rate limiting / Cloudflare WAF rules to the login endpoint for a public production site.

## Project structure
```text
.
├── index.html
├── styles.css
├── app.js
├── functions/
│   ├── _lib/auth.js
│   └── api/
│       ├── videos.js
│       ├── videos/[id].js
│       └── admin/
│           ├── login.js
│           ├── logout.js
│           └── session.js
├── migrations/0001_create_videos.sql
├── wrangler.toml
└── package.json
```
