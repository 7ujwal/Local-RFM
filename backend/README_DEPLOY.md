# Backend Deployment to Render (Free Tier)

## Prerequisites
1. MongoDB Atlas free cluster created
2. GitHub repo pushed to https://github.com/YOUR_USERNAME/Roaming-from-Rohru
3. Your Google email is `roamingfromrohru@gmail.com`

## Deployment Steps

### Step 1: Create Render Account
1. Visit https://render.com
2. Sign up (GitHub authentication recommended)
3. Verify email

### Step 2: Create Web Service
1. Dashboard → New → Web Service
2. Connect your GitHub repository
3. Name: `roaming-from-rohru-api`
4. Region: Choose closest to you

### Step 3: Configure Build & Start
```
Build Command: pip install -r requirements.txt
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Step 4: Set Environment Variables
In Render → Your Service → Environment → Add:

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://rohru_admin:YOUR_PASSWORD@CLUSTER_NAME.mongodb.net/?retryWrites=true&w=majority` |
| `DB_NAME` | `roaming_from_rohru` |
| `CORS_ORIGINS` | `https://YOUR_GITHUB_USERNAME.github.io` |
| `ADMIN_EMAIL` | `roamingfromrohru@gmail.com` |
| `ADMIN_PASSKEY` | *(leave empty, or set a password)* |

**Optional:**
| Key | Value |
|-----|-------|
| `RAZORPAY_KEY_ID` | *(for production payments)* |
| `RAZORPAY_KEY_SECRET` | *(for production payments)* |
| `RESEND_API_KEY` | *(for email notifications)* |

### Step 5: Create Persistent Disk (For Uploads)
1. In your service settings → Disk
2. Enable "Persistent Disk"
3. Size: 1 GB minimum (adjustable)
4. Mount path: `/app/backend/uploads` (already in code)
5. **Important**: Click "Save Changes"

### Step 6: Deploy
1. Render auto-builds on first save
2. Wait 2-5 minutes for first build
3. Check "Logs" tab for "MongoDB connection successful"

## Service Details

**URL Format**: `https://roaming-from-rohru-api.onrender.com`

**Endpoints**:
- Health: `GET /`
- API: `GET /api/`
- Bookings: `POST /api/bookings`
- Admin: `GET /api/auth/me`

## Free Tier Limits

- **750 hours/month** (always-on for free)
- **512 MB RAM**
- **Persistent Disk** (1 GB included)
- **No credit card required**

## Troubleshooting

### "MongoDB connection failed"
- Check MONGO_URL format
- Verify Atlas IP whitelist includes 0.0.0.0/0
- Check DB_NAME is set correctly

### "403 Forbidden" on routes
- Check CORS_ORIGINS matches frontend URL
- Ensure no trailing slashes in URLs

### "Upload failed"
- Verify persistent disk is enabled
- Check uploads directory exists

### Service restarts frequently
- Check logs for errors
- Ensure environment variables are correct

## Monitoring

- **Logs**: Real-time logs in Render dashboard
- **Metrics**: CPU, memory usage
- **Alerts**: Email notifications on downtime

## Updates

Push to `main` branch → Auto-redeploy

## Common Environment Values

```bash
# Production (Update YOUR values)
MONGO_URL=mongodb+srv://rohru_admin:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=roaming_from_rohru
CORS_ORIGINS=https://your-github-username.github.io
ADMIN_EMAIL=roamingfromrohru@gmail.com
```

**Note**: Update `CORS_ORIGINS` to match your actual frontend URL after deployment.