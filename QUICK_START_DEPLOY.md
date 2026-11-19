# Quick Start Deployment Guide

## You Need to Do (Before I Can Deploy):

1. **GitHub Account** - Push your repo
2. **MongoDB Atlas Account** - Create free cluster
3. **Render Account** - For backend deployment
4. **Cloudflare Account** - For frontend deployment

---

## Step-by-Step for You

### Step 1: Push Code to GitHub
```bash
# Replace YOUR_GITHUB_USERNAME
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Roaming-from-Rohru.git
git push -u origin main
```

### Step 2: Create MongoDB Atlas Cluster
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create account → Build a Cluster
3. **FREE** M0 Sandbox tier
4. Database Access → User: `rohru_admin`, Password: (your password)
5. Network Access → Add IP: `0.0.0.0/0`
6. Connect → Copy connection string

### Step 3: Get Backend Environment Ready
From MongoDB Atlas connection string, format for Render:

**MONGO_URL**:
```
mongodb+srv://rohru_admin:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
```

**DB_NAME**:
```
roaming_from_rohru
```

### Step 4: Sign Up for Free Services
- **Render** (backend): https://render.com
- **Cloudflare Pages** (frontend): https://pages.cloudflare.com

### Step 5: Deploy Backend to Render
1. Log in to Render
2. New → Web Service
3. Connect your GitHub repo
4. Build Command: `pip install -r backend/requirements.txt`
5. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Environment Variables:
   ```
   MONGO_URL=mongodb+srv://rohru_admin:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=roaming_from_rohru
   CORS_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
   ADMIN_EMAIL=roamingfromrohru@gmail.com
   ```

### Step 6: Deploy Frontend to Cloudflare Pages
1. Log in to Cloudflare Pages
2. Create Project → Connect GitHub repo
3. Build Settings:
   - Framework: Other
   - Build command: `cd frontend && yarn install && yarn build`
   - Output directory: `frontend/build`
4. Environment Variable:
   - `REACT_APP_BACKEND_URL` = `https://your-render-url.onrender.com`

### Step 7: Update CORS in Render
In Render dashboard → Your API service → Environment:
```
CORS_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

---

## Your Credentials (Fill These In)

```
GitHub Username: ________________
MongoDB Cluster Name: ________________
MongoDB Password: ________________
Render Service URL: ________________
```

---

## After Deployment

- **Frontend URL**: `https://YOUR_GITHUB_USERNAME.github.io/Roaming-from-Rohru/`
- **Admin URL**: `https://YOUR_GITHUB_USERNAME.github.io/Roaming-from-Rohru/admin`
- **API URL**: `https://YOUR_RENDER_URL.onrender.com`

---

## Test Checklist

- [ ] Homepage loads with hero video
- [ ] Explore page shows places/food/culture
- [ ] Events page shows upcoming events
- [ ] Contact form works
- [ ] Booking form submits successfully
- [ ] Admin login works
- [ ] Image uploads work
- [ ] Changes in admin panel appear live

---

## Questions?

1. **MongoDB Setup**: See `MONGODB_SETUP.md`
2. **Cloudinary**: See `CLOUDINARY_SETUP.md`
3. **General deployment**: See `DEPLOYMENT.md`