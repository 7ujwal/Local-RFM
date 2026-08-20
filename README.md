# Roaming From Rohru

Promotional travel and events site for Rohru (Shimla district, Himachal Pradesh): public pages, Razorpay bookings, and a Google-gated owner admin CMS.

## 1. Project architecture

| Layer | Stack | Role |
| --- | --- | --- |
| Frontend | React 19, Create React App 5 (`react-scripts` + CRACO), Tailwind, React Router 7 | Static SPA |
| Backend | FastAPI (`backend/server.py`) + Uvicorn | REST API under `/api` |
| Database | MongoDB via Motor (async) | Content, events, bookings, sessions |
| Auth | Emergent Google OAuth → httpOnly `session_token` cookie; optional passkey + Resend OTP | Admin only |
| Payments | Razorpay (demo mode if keys are unset) | Event bookings |
| Email | Resend (skipped if `RESEND_API_KEY` is unset) | Booking alerts + admin OTP |
| Uploads | Local disk `backend/uploads/`, served at `/api/uploads/*` | Admin images/videos |

**Deployment model:** host the **frontend on Vercel**. Host the **Python API on a long-running host** (Render, Railway, Fly.io, or a VPS). Do not run this FastAPI app as Vercel Python serverless: it uses a persistent Motor client, filesystem uploads (including large video), Uvicorn, and `asyncio.create_task` email side-effects.

## 2. Requirements

- Git
- **Node.js 18–22** (see `.nvmrc`: 20)
- **Python 3.11 or 3.12** (`backend/runtime.txt` targets 3.12)
- Yarn 1.22 (declared in `frontend/package.json` as `packageManager`)
- A remotely reachable MongoDB (MongoDB Atlas recommended for production)

## 3. Node.js version

Use Node **18 or newer** (20 or 22 recommended; 24 is the current Windows LTS). Confirm with `node -v`.

## 4. Python version

Use Python **3.11+** (3.12 preferred). Confirm with `python --version`.

## 5. Frontend installation

```powershell
cd frontend
yarn install
copy .env.example .env
```

Edit `frontend/.env` if the API is not on `http://localhost:8000`.

## 6. Backend installation

```powershell
cd backend
python -m pip install -r requirements.txt
```

From the repository root (recommended isolated environment):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

## 7. Virtual environment setup (Windows)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Deactivate later with `deactivate`.

## 8. Environment variables

Never commit real `.env` files. Copy the example files:

- `frontend/.env.example` → `frontend/.env`
- `backend/.env.example` → `backend/.env`

### Frontend

| Name | Purpose |
| --- | --- |
| `REACT_APP_BACKEND_URL` | Backend origin with no trailing slash, e.g. `http://localhost:8000` or `https://api.example.com` |

Create React App inlines this **at build time**. Changing it on Vercel requires a rebuild.

### Backend

| Name | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection URI |
| `DB_NAME` | Database name |
| `CORS_ORIGINS` | Comma-separated frontend origins (no `*` when using cookies) |
| `ADMIN_EMAIL` | Google account allowed into `/admin` |
| `ADMIN_PASSKEY` | Optional second admin lock; omit to disable |
| `RAZORPAY_KEY_ID` | Optional; omit for demo bookings |
| `RAZORPAY_KEY_SECRET` | Optional |
| `RESEND_API_KEY` | Optional; omit to skip email/OTP |
| `SENDER_EMAIL` | Resend “from” address |

## 9. MongoDB setup

1. Create a MongoDB Atlas cluster (or another hosted MongoDB).
2. Create a database user and allow your backend host IP (or `0.0.0.0/0` only if you accept the risk).
3. Copy the `mongodb+srv://…` URI into `MONGO_URL`.
4. Set `DB_NAME` (example: `roaming_from_rohru`).
5. Collections are created automatically. On first successful connection the API seeds explore/events/contact if those collections are empty.

Do not rely on `localhost` MongoDB for production.

## 10. Local development commands

Terminal 1 — API (from repo root, venv activated):

```powershell
cd backend
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2 — SPA:

```powershell
cd frontend
yarn start
```

Frontend: [http://localhost:3000](http://localhost:3000)  
API: [http://localhost:8000/api/](http://localhost:8000/api/)

## 11. Production build commands

```powershell
cd frontend
yarn build
```

Output is `frontend/build`.

Backend is not bundled; run Uvicorn (or the `backend/Procfile` command) on the API host.

## 12. Vercel deployment instructions

1. Import this repository in Vercel.
2. Leave the project root as the **repository root** (root `vercel.json` builds `frontend`). Alternatively set **Root Directory** to `frontend` and use `frontend/vercel.json`.
3. Framework: Other / Create React App. Build is already defined:
   - Install: `yarn --cwd frontend install`
   - Build: `yarn --cwd frontend build`
   - Output: `frontend/build`
4. Set `REACT_APP_BACKEND_URL` to the **public HTTPS URL of the deployed API** (no trailing slash), then redeploy.
5. SPA routes (`/explore`, `/admin`, …) are rewritten to `index.html`.

Vercel does **not** run the FastAPI backend.

## 13. Backend deployment instructions

Deploy `backend/` as a web service on Render, Railway, Fly.io, or a VPS.

- Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Set every backend environment variable listed above.
- `CORS_ORIGINS` must include the Vercel URL (and custom domain), e.g. `https://your-app.vercel.app,https://www.yourdomain.com`
- Give the service **persistent disk** if you need uploaded hero videos/images to survive redeploys. Ephemeral filesystems will lose `backend/uploads/`.
- After the API is live, set `REACT_APP_BACKEND_URL` on Vercel and rebuild the frontend.

## 14. Admin setup

1. Set `ADMIN_EMAIL` to the owner Google account (default in code is `roamingfromrohru@gmail.com` if unset).
2. Sign in at `/admin` via Emergent Google OAuth (`https://auth.emergentagent.com/`).
3. Set `ADMIN_PASSKEY` to require a second factor. Leave empty to skip that gate.
4. Set `RESEND_API_KEY` to require email OTP as a third factor.

Admin passwords and passkeys must never be placed in React source.

## 15. Email / Resend configuration

1. Create a Resend API key.
2. Set `RESEND_API_KEY` and a verified `SENDER_EMAIL`.
3. Booking alert emails and admin OTP are skipped (logged) when the key is missing.

## 16. Image / file storage configuration

Uploads are written to `backend/uploads/` and returned as `/api/uploads/<file>`. That path is **not durable on Vercel** and is **not durable on most free PaaS disks**.

This project does not include Cloudinary/S3. For production media that must persist, attach a persistent volume to the API host, or later add an object store (without changing the public API contract if possible). External image URLs already work in the admin “paste URL” fields.

## 17. Troubleshooting

| Problem | What to check |
| --- | --- |
| Frontend calls `undefined/api` or wrong host | `REACT_APP_BACKEND_URL` at **build** time; rebuild after changing it |
| CORS / cookies fail after login | `CORS_ORIGINS` must be the exact frontend origin(s); cookies use `Secure` + `SameSite=None` |
| API exits immediately | `MONGO_URL` and `DB_NAME` missing |
| Mongo timeout | Atlas Network Access, URI user/password, `mongodb+srv` DNS |
| Admin 403 | Google email must match `ADMIN_EMAIL` |
| OTP never arrives | `RESEND_API_KEY` / `SENDER_EMAIL` |
| Uploaded video disappears | API host filesystem is ephemeral; use a volume or a URL |
| `yarn install` fails on `@emergentbase/visual-edits` | Dev-only Emergent tarball; needed for `yarn install`. Retry or check network access to `assets.emergent.sh` |
| Port 8000 in use | Change `--port` and `REACT_APP_BACKEND_URL` |

## License

Private project for Roaming From Rohru.
