# FACEQUEST

### Your character. Your curiosity. Your quest.

**A web-based gamified adventure platform with avatar customization, mission management, XP progression and digital rewards.**

[Explore the live demo](https://facquest.vercel.app/)

FaceQuest brings short interactive adventures, illustrated characters and a persistent rewards system into one platform. Players create an avatar, complete missions, earn experience points, save selected mission photos and use available XP to unlock avatar items or demo coupons.

> Final-year engineering project · React + Vite · Node.js + Express · PostgreSQL / Neon

---

## Project overview

| Detail | Description |
| --- | --- |
| Project | FaceQuest |
| College | Pravin Rohidas Patil College of Engineering and Technology |
| Project guide | Jagruti Patil |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database | PostgreSQL hosted on Neon |
| Interface | Mocha brown, champagne gold and burnt amber |

## Features

### Player accounts

- Register and log in with an individual player profile.
- Restore a valid login session after refreshing the page.
- Track lifetime XP, available XP, levels and collected mission rewards.

### Illustrated Avatar Studio

- Customize skin tone, hair, eyes, face shape, expressions and outfits.
- Choose accessories, poses and backdrops.
- Use presets, randomization and undo controls.
- Export an avatar as a PNG, including a transparent-background option.
- Buy premium styles with XP and own them permanently; free items remain available.

Avatars are customizable illustrations. They are not automatically reconstructed from a selfie.

### Interactive missions

- Play puzzle, exploration and camera-guided challenges.
- Use browser-based face detection for supported camera interactions.
- Earn fixed server-issued mission rewards, with one XP claim per mission per UTC day.
- Replay missions for practice without repeatedly collecting the same daily reward.

### Personal photo gallery

- Review captured photos before deciding whether to upload them.
- Complete a mission without saving its photos.
- View and delete saved photos through the authenticated gallery.
- Keep saved photos in the database so they survive backend redeployments.

### Rewards and progression

- Receive daily login rewards and progress through a seven-day reward streak.
- Access referral codes and referral rewards.
- Purchase avatar styles in **Avatar Studio → Shop**.
- Exchange available XP for sample coupons in **Redeem Store**.
- View redeemed coupon codes in **My Coupons**.

> Coupons are project demonstrations. They have no cash value and are not valid with real merchants.

## Mission collection

| Mission | Experience | Type |
| --- | ---: | --- |
| The Crystal Puzzle | 300 XP | Puzzle |
| Explore the Frontier | 150 XP | Exploration |
| Restore the Portal | 200 XP | Interactive challenge |
| Light Seeker | 200 XP | Camera |
| The Face Explorer | 300 XP | Camera / face checkpoints |
| Focus Bridge | 200 XP | Camera / focus challenge |
| Dragon's Eye | 250 XP | Camera / action challenge |
| Mirror Maze | 250 XP | Camera / navigation challenge |
| Starship Navigator | 250 XP | Camera / navigation challenge |
| The Lost Portraits | 250 XP | Camera / portrait challenge |
| Rhythm of the Realm | 250 XP | Camera / rhythm challenge |

## How XP works

FaceQuest keeps earned XP separate from spending:

| Value | Purpose |
| --- | --- |
| Lifetime XP | Total experience earned; determines the player's level |
| Spent XP | Experience already used for purchases |
| Available XP | Lifetime XP minus spent XP; used by both stores |
| Level | One additional level for every 300 lifetime XP |

Purchasing an item reduces available XP while preserving lifetime XP and the earned level. Premium avatar items are purchased once and can then be equipped again without another charge.

Mission XP is awarded once per mission per UTC day. The frontend runs the gameplay, while the backend controls reward amounts, duplicate claims, balances and purchases. Historical XP that existed only in older browser storage is not automatically imported into the database wallet.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, JavaScript, CSS, SVG artwork |
| Camera interactions | Browser MediaDevices API, MediaPipe Tasks Vision |
| Image export | Browser Canvas API |
| Backend | Node.js, Express |
| Authentication | JSON Web Tokens, bcrypt password hashing |
| Database | PostgreSQL, Neon, node-postgres |
| Image processing | Sharp |
| Hosting | Vercel frontend, Render backend |

## Project structure

| Path | Responsibility |
| --- | --- |
| `client/src/App.jsx` | Application entry, landing page and top-level navigation |
| `client/src/PremiumTheme.css` | Shared premium theme and responsive styling |
| `client/src/pages/` | Authentication and player dashboard |
| `client/src/features/avatar/` | Avatar artwork, customization and avatar purchases |
| `client/src/features/games/` | Puzzle and exploration games |
| `client/src/features/camera/` | Camera missions and photo-save controls |
| `client/src/features/gallery/` | Saved-photo browsing and deletion |
| `client/src/features/rewards/` | XP coupon store and redeemed coupons |
| `server/index.js` | Backend startup |
| `server/routes/` | Authentication, avatar, wallet, rewards and photo endpoints |

## Run locally

### Prerequisites

- Node.js and npm, using a runtime compatible with the project's dependency requirements.
- A PostgreSQL / Neon database initialized with the FaceQuest schema.
- A browser with camera permission for camera missions.

The database must include the account, avatar, photo-storage, XP-wallet, item-ownership, mission-claim and coupon-redemption structures used by the backend. Apply the project's schema and XP/redeem-store SQL to your development database before testing those features. A code deployment alone does not replace database setup.

### 1. Install dependencies

From the project root:

```bash
npm --prefix server install
npm --prefix client install
```

### 2. Configure the backend

Create `server/.env` and enter your own values:

```env
DATABASE_URL=YOUR_POSTGRESQL_CONNECTION_STRING
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_URLS=http://localhost:5173
PORT=5000
PG_SSL=true
```

Use the Neon connection string for `DATABASE_URL`. Keep TLS enabled for Neon. Keep the JWT secret stable across redeployments if existing login tokens should remain valid.

### 3. Configure the frontend

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

This value is the backend origin, without an extra `/api` suffix. Frontend variables prefixed with `VITE_` are public; use them only for non-secret configuration.

### 4. Start both applications

Backend terminal, from the project root:

```bash
npm --prefix server run dev
```

Frontend terminal, from the project root:

```bash
npm --prefix client run dev
```

Open the address printed by Vite, usually `http://localhost:5173`. If Vite uses another port, add that exact origin to the backend's allowed frontend origins. Camera access requires HTTPS on a hosted site or localhost during development.

## Deployment

### Render backend

Use the existing backend service and its connected Git branch.

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Dependency installation | `npm ci` or the existing validated build command |
| Start command | `npm start` |
| Environment | Set database, JWT and allowed frontend-origin values in Render |

Set `FRONTEND_URLS` to the exact Vercel frontend origin. If local development is also needed, include both origins as a comma-separated list. Keep database credentials and secrets in backend environment settings.

### Vercel frontend

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Public API configuration | `VITE_API_URL` set to the Render backend origin |

Update the backend first, then verify the frontend deployment uses the matching commit. Frontend environment changes require a new build. After deployment, test login, a mission, XP rewards, avatar saving, coupons and the photo gallery.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a player account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Load the authenticated player |
| GET | `/api/auth/daily-reward/status` | Check daily reward availability |
| POST | `/api/auth/daily-reward/claim` | Claim an eligible daily reward |
| GET / PUT | `/api/avatar` | Load or save avatar settings |
| GET | `/api/avatar/progress` | Load wallet and mission progress |
| POST | `/api/avatar/mission-reward` | Claim a fixed daily mission reward |
| POST | `/api/avatar/purchase` | Purchase an avatar item |
| GET | `/api/avatar/coupons` | Load demo coupons and owned codes |
| POST | `/api/avatar/coupons/redeem` | Redeem an eligible coupon |
| GET / POST | `/api/images` | List saved photo metadata or upload a photo |
| GET | `/api/images/:id/content` | Retrieve an authenticated owner's photo |
| DELETE | `/api/images/:id` | Delete an authenticated owner's photo |

Protected endpoints in this release use an `Authorization: Bearer <token>` header. Registration and login are public endpoints. Photo uploads require the app's explicit save consent.

## Privacy and security status

The current release uses password hashing, authenticated API requests, account ownership checks for photos and server-side validation of wallet purchases and reward claims. Image processing validates supported formats and removes EXIF metadata before storage.

The current browser session uses JWT-based authentication with browser storage. Application-level photo encryption, HttpOnly cookie sessions, server-side session revocation and additional privacy controls belong to a separate hardening update and are **not claimed as deployed features of this release**.

- Keep `.env` files, private photos, database exports and credentials out of Git.
- Treat the application as an academic prototype when handling personal images.
- Browser-side face detection supports gameplay; the app does not claim to identify people or provide biometric identity verification.
- Database backups have their own retention schedule after a photo is deleted from the active application.

## Build and review checks

From the project root:

```bash
npm --prefix client run build
node --check server/index.js
node --check server/routes/avatar.js
node --check server/routes/images.js
npm --prefix server audit --omit=dev
```

A successful build or dependency audit is one part of verification. Also check the deployed frontend/backend connection, database schema and camera flow in a real browser.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Invalid or expired session | Log out and sign in again; verify the backend JWT secret is configured consistently |
| Frontend cannot reach the API | Check `VITE_API_URL`, the Render deployment and allowed frontend origins |
| Old interface still appears | Confirm the deployment uses the latest commit, then hard-refresh the page |
| Wallet or coupon request fails | Check that the Avatar Shop and Redeem Store database migrations were applied |
| Camera permission is unavailable | Use HTTPS or localhost and grant browser camera access |
| First API request takes longer after inactivity | Allow time for the hosting instance to wake, then retry |

## Future scope

- Deploy and validate the prepared photo-encryption and session-hardening update.
- Add email verification and multi-factor authentication.
- Strengthen server-side verification of mission completion.
- Introduce more missions, accessibility options and avatar collections.
- Add an administration interface for missions and rewards.
- Explore verified reward partnerships to replace demo coupons.

---

**FACEQUEST — make a little room for adventure.**
