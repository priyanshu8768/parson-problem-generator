# Vercel Deployment Guide

## 🚀 Deploy Your Parson Problem Generator to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account connected to Vercel
- Your project pushed to GitHub

### Step 1: Prepare Your Project

1. **Update Environment Variables**
   - In `backend-main/.env`, add your production API keys:
   ```env
   SECRET_KEY=your-production-secret-key
   CLAUDE_API_KEY=your-production-claude-key
   GEMINI_API_KEY=your-production-gemini-key
   SIGNING_KEY=your-production-signing-key
   DEBUG=False
   ```

2. **Update Frontend API URL**
   - In `frontend-main/.env.production`, replace:
   ```env
   REACT_APP_API_URL=https://your-vercel-app-url.vercel.app/api
   ```

### Step 2: Deploy Frontend to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Deploy Frontend**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select `frontend-main` as root directory
   - Vercel will auto-detect React
   - Click "Deploy"

### Step 3: Deploy Backend to Vercel

1. **Create Backend Deployment**
   - In Vercel, click "New Project"
   - Select same repository
   - Set root directory to `backend-main`
   - Framework preset: "Python"
   - Build command: `pip install -r requirements.txt`
   - Output directory: `.`
   - Add environment variables from your `.env` file

### Step 4: Configure API Routes

1. **Update Frontend API Calls**
   - In your React components, use:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
   ```

2. **Test the Deployment**
   - Frontend: `https://your-frontend-url.vercel.app`
   - Backend API: `https://your-backend-url.vercel.app/api`

### Alternative: Monorepo Deployment

For a single deployment, use the root `vercel.json`:

1. **Deploy Root Directory**
   - Set root directory to project root
   - Vercel will handle both frontend and backend

### Environment Variables Setup

In Vercel dashboard, add these environment variables:

**Backend:**
- `DJANGO_SETTINGS_MODULE=FINALYEARPROJECT.settings`
- `SECRET_KEY=your-production-secret`
- `CLAUDE_API_KEY=your-claude-key`
- `GEMINI_API_KEY=your-gemini-key`
- `SIGNING_KEY=your-signing-key`
- `DEBUG=False`

**Frontend:**
- `REACT_APP_API_URL=https://your-backend-url.vercel.app/api`

### Troubleshooting

**Common Issues:**
1. **CORS Errors**: Update Django CORS settings
2. **API Routes Not Found**: Check Vercel routing configuration
3. **Environment Variables**: Ensure all required variables are set
4. **Build Failures**: Check Python version compatibility

**Debug Commands:**
```bash
# Test backend locally
cd backend-main
python manage.py runserver

# Test frontend locally
cd frontend-main
npm start
```

### Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Claude AI feedback works
- [ ] User authentication functions
- [ ] Static files load properly
- [ ] Environment variables are secure

### Monitoring

- Check Vercel logs for any errors
- Monitor API response times
- Set up error tracking if needed

Your Parson Problem Generator is now live on Vercel! 🎉
