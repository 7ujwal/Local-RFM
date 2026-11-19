# Deployment Guide - Roaming From Rohru

## Production Deployment on Free Tiers

### Services Being Used
- **Frontend Hosting**: Cloudflare Pages (Free)
- **Backend Hosting**: Render (Free Web Service)
- **Database**: MongoDB Atlas M0 Free Tier
- **Image Storage**: Cloudinary Free Plan

---

## Step 1: GitHub Repository Setup

1. Push your code to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/Roaming-from-Rohru.git
git push -u origin main
```

## Step 2: MongoDB Atlas Setup (Free M0 Cluster)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create account → Build a Cluster → **FREE** tier
3. Create Database User:
   - Username: `rohru_admin`
   - Password: Generate a secure password (save this!)
4. Network Access → Add IP Address → `0.0.0.0/0` (allow all - temporary for testing)
5. Get Connection String → Copy the `mongodb+srv://...` URI

## Step 3: Cloudinary Setup (Free Plan)

1. Go to [Cloudinary](https://cloudinary.com/) → Sign up (Free plan)
2. Get your **Cloudinary URL** from Dashboard:
   - Cloud name
   - API Key
   - API Secret

## Step 4: Backend Environment Variables (Render)

Create `.env` file for Render:

```bash
# MongoDB
MONGO_URL=mongodb+srv://rohru_admin:YOUR_PASSWORD@rohru-cluster.mongodb.net
DB_NAME=roaming_from_rohru

# Admin (change from default!)
ADMIN_EMAIL=roamingfromrohru@gmail.com
ADMIN_PASSKEY=your-secure-passkey-here

# CORS - Update to match your frontend URL
CORS_ORIGINS=https://your-github-username.github.io

# Optional - For bookings
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional - For emails
RESEND_API_KEY=
SENDER_EMAIL=onboarding@resend.dev
```

## Step 5: Frontend Environment Variables (Cloudflare Pages)

Create `frontend/.env` for local build (then use Netlify/Cloudflare UI in production):

```bash
REACT_APP_BACKEND_URL=https://your-render-service.onrender.com/api
```

## Step 6: Deploy Backend to Render (Free)

1. Go to [Render](https://render.com) → Sign up (Free)
2. New → Web Service
3. Connect your GitHub repo
4. Build Command: `pip install -r backend/requirements.txt`
5. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Environment → Add all env vars from Step 4
7. Click Create Web Service

**Free Tier Limits:**
- 750 hours/month (enough for always-on)
- 512 MB RAM
- No paid features

## Step 7: Deploy Frontend to Cloudflare Pages (Free)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/) → Sign in
2. Create a Project → Connect GitHub repo
3. Build Settings:
   - Framework: Other
   - Build command: `cd frontend && yarn install && yarn build`
   - Output directory: `frontend/build`
4. Environment Variables:
   - `REACT_APP_BACKEND_URL` = `https://your-render-url.onrender.com`
5. Deploy

## Step 8: Configure CORS for Production

Edit `backend/server.py` - ensure CORS_ORIGINS is set correctly in Render:
```
CORS_ORIGINS=https://your-github-username.github.io,https://your-render-url.onrender.com
```

## Step 9: Test Production Deployment

1. Visit: `https://your-github-username.github.io/Roaming-from-Rohru/`
2. Test booking: `/api/bookings` endpoint should work
3. Test admin: `/admin` login should work

---

## Production URL After Deployment

- **Frontend**: `https://YOUR_GITHUB_USERNAME.github.io/Roaming-from-Rohru/`
- **Admin**: `https://YOUR_GITHUB_USERNAME.github.io/Roaming-from-Rohru/admin`
- **Backend API**: `https://YOUR_RENDER_SERVICE.onrender.com`

---

## Maintenance & Updates

### Updating Content
1. Login to admin panel
2. Edit content in "Site Text & Images" tab
3. Click "Publish Changes" - live immediately

### Deploying Updates
1. Push changes to GitHub `main` branch
2. Cloudflare Pages auto-builds on push
3. Render auto-rebuilds on changes

### Adding New Events
1. Go to `/admin` → "Events" tab
2. Click "Add Event"
3. Fill form → Save

### Adding New Places
1. Go to `/admin` → "Explore Content" tab
2. Switch between Places/Food/Culture tabs
3. Click "Add Entry"
4. Upload images via URL or direct upload

---

## Troubleshooting

### CORS Errors
```bash
# In Render, update:
CORS_ORIGINS=https://your-github-username.github.io
```

### Booking Not Working
1. Check MONGO_URL is correct in Render
2. Verify Render service is "Running"
3. Test `/api/ping-db` endpoint

### Images Not Loading
1. Cloudinary uploads require proper URL format
2. Check image URLs start with `https://res.cloudinary.com/` or your CDN

### Admin Login Issues
1. Ensure ADMIN_EMAIL matches your Google account
2. If using passkey, ensure ADMIN_PASSKEY is set

---

## Free Plan Limits Summary

| Service | Free Plan | Monthly Limit |
|---------|-----------|---------------|
| Cloudflare Pages | Free | 500 build minutes, 10 GB bandwidth |
| Render Web Service | Free | 750 hours (always-on), 512 MB RAM |
| MongoDB Atlas | M0 | 512 MB storage, 100 Connections |
| Cloudinary | Free | 25 GB bandwidth, 300k transformations |

---

## Security Checklist

- [ ] ADMIN_PASSKEY set in Render (optional but recommended)
- [ ] MONGO_URL not public (kept in environment)
- [ ] CORS_ORIGINS restricted to your domains
- [ ] No `.env` files committed to repo (check .gitignore)
- [ ] Admin email is your Google account