# Cloudinary Free Plan Setup Guide

## Creating a Cloudinary Account (Free Plan)

### Step 1: Sign Up
1. Go to [Cloudinary](https://cloudinary.com/)
2. Click "Sign up for free"
3. Choose **"Free"** plan (no credit card required)
4. Complete registration

### Step 2: Get Your Credentials
1. Log in to Cloudinary Dashboard
2. Go to **Settings** → **Account**
3. Find your **Cloud name** (e.g., `dxm7m4j5w`)
4. Note: **API Key** and **API Secret**

Credentials example:
```
Cloud Name: dxm7m4j5w
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz
```

## Image Upload Options

### Option A: Direct Upload URL (Recommended for Admin)
When users upload images from the admin panel, images are:
1. Uploaded directly to your MongoDB/uploads folder via backend
2. Served from `/api/uploads/*` endpoint

**No Cloudinary integration needed for basic usage.**

### Option B: Cloudinary URL Paste (Already Supported)
In admin panel, you can paste Cloudinary URLs directly:
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/your-image.jpg
```

The app accepts any valid image URL for hero images, explore items, and event galleries.

## Cloudinary Free Plan Limits

| Resource | Free Limit |
|----------|------------|
| Storage | 25 GB |
| Bandwidth | 25 GB/month |
| Transformations | 300,000/month |
| Users | 1 |

## Production Deployment with Cloudinary

If you want to use Cloudinary for direct uploads:

### 1. Add Environment Variables in Render
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret-key
```

### 2. Update Backend for Cloudinary Upload (Optional)

If you want direct Cloudinary uploads from admin:

```python
# Add to backend/server.py imports
import cloudinary
import cloudinary.uploader

# Configure (in backend/.env on Render)
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# In admin_upload function, replace file saving with:
result = cloudinary.uploader.upload(data, folder="roaming_from_rohru")
return {"url": result["secure_url"]}
```

## Current Implementation (Simpler)

The current implementation does NOT require Cloudinary:
- Uploads go to local filesystem (backend/uploads/)
- Served at `/api/uploads/<filename>`
- For Render free tier, you need **persistent disk** enabled
  - In Render: Settings → Disk → Enable persistent disk

## Persistent Disk for Image Uploads

When deploying to Render:
1. After creating your web service
2. Go to **Settings** → **Disk**
3. Enable **Persistent Disk** (2 GB should be enough for demo)
4. This ensures uploads survive restarts/redeploys

## Testing Image Uploads

1. Login to admin panel
2. Go to "Site & Contact" tab
3. Upload hero video/image
4. Visit homepage - should show new image

## Troubleshooting

### Images not showing after restart
- Enable persistent disk on Render
- Or use Cloudinary/external URLs

### URL paste not working
- Ensure URL ends with image extension (.jpg, .png, .webp)
- Check CORS headers if using external host

### Upload fails
- Check file size (max 8MB images, 200MB videos)
- Check file type (image/* or video/*)