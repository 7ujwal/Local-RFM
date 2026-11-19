# Frontend Deployment to Cloudflare Pages

## Prerequisites
1. Backend deployed to Render with production URL
2. MongoDB Atlas cluster running
3. Your GitHub username ready

## Deployment Steps

### Step 1: Update Frontend Environment

Create `.env.production` in `frontend/`:
```bash
REACT_APP_BACKEND_URL=https://your-render-service.onrender.com/api
```

Build the production version:
```bash
cd frontend
yarn build
```

The build output will be in `frontend/build/`

### Step 2: Deploy to Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Sign in with your Cloudflare account
3. Click "Create a project"
4. Connect to your GitHub repository
5. In the "Build settings":
   - Framework: Select "Other"
   - Build command: `cd frontend && yarn install && yarn build`
   - Output directory: `frontend/build`
6. Add environment variable:
   - Key: `REACT_APP_BACKEND_URL`
   - Value: `https://your-render-url.onrender.com` (no `/api` suffix)
7. Click "Save and deploy"

### Step 3: Get Your URL

After deployment, you'll get:
```
https://YOUR_GITHUB_USERNAME.github.io/Roaming-from-Rohru/
```

### Step 4: Update Backend CORS

In Render dashboard:
1. Go to your API service
2. Environment → Edit `CORS_ORIGINS`
3. Set to: `https://YOUR_GITHUB_USERNAME.github.io`

### Step 5: Test Production

1. Visit: `https://YOUR_GITHUB_USERNAME.github.io/Roaming-from-Rohru/`
2. Check browser console for CORS errors
3. Test booking form
4. Test admin login

## Build Commands

### Local Development
```bash
cd frontend
yarn start  # http://localhost:3000
```

### Production Build
```bash
cd frontend
yarn build  # Creates optimized build in ./build
```

### Preview Build
```bash
cd frontend
yarn build && npx serve -s build  # Preview at http://localhost:5000
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `REACT_APP_BACKEND_URL` | Yes | API endpoint (e.g., https://api-service.onrender.com) |

**Note**: Variables must be prefixed with `REACT_APP_` for Create React App to include them.