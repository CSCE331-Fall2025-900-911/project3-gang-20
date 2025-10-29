# Vercel Deployment Guide

This guide will help you deploy your React + Django project to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/cli) installed (optional but recommended)
- Git repository pushed to GitHub, GitLab, or Bitbucket

## Project Structure for Vercel

The project is configured with:
- **Frontend**: React app in [frontend/](frontend/) directory
- **Backend**: Django app as serverless functions
- **Configuration**: [vercel.json](vercel.json) for deployment settings

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for first deployment)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will automatically detect the configuration

3. **Configure Environment Variables**:
   In your Vercel project settings, add these environment variables:

   ```
   DJANGO_SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=.vercel.app
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your project

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

   For production:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DJANGO_SECRET_KEY
   vercel env add DEBUG
   vercel env add ALLOWED_HOSTS
   ```

## Important Configuration Files

### [vercel.json](vercel.json)
Configures:
- Backend as Python serverless function
- Frontend as static build
- Routing between frontend and backend
- API routes under `/api/`

### [backend/settings.py](backend/settings.py)
Updated for production:
- Environment-based SECRET_KEY
- Environment-based DEBUG mode
- Dynamic ALLOWED_HOSTS
- CORS configuration for production

### [backend/wsgi.py](backend/wsgi.py)
Exports `app` for Vercel serverless function handler

## Project URLs After Deployment

Once deployed, your project will be available at:
- **Frontend**: `https://your-project.vercel.app/`
- **Backend API**: `https://your-project.vercel.app/api/`
- **Django Admin**: `https://your-project.vercel.app/admin/`

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key for production | Random 50+ character string |
| `DEBUG` | Debug mode (should be False in production) | `False` |
| `ALLOWED_HOSTS` | Allowed hosts for Django | `.vercel.app` |

## Generating a Secret Key

Run this Python command to generate a secure secret key:

```python
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Or use the Django shell:
```bash
source venv/bin/activate
python manage.py shell -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Troubleshooting

### Build Fails
- Check that all dependencies are in [requirements.txt](requirements.txt)
- Verify [frontend/package.json](frontend/package.json) has all required packages
- Check Vercel build logs for specific errors

### API Routes Not Working
- Ensure routes in [vercel.json](vercel.json) match your URL patterns
- Check that `backend/wsgi.py` exports `app` variable
- Verify environment variables are set correctly

### CORS Errors
- Check [backend/settings.py](backend/settings.py) CORS configuration
- Ensure your Vercel domain is in `CORS_ALLOWED_ORIGINS`
- In production, `CORS_ALLOW_ALL_ORIGINS` is set to True

### Database Issues
- Vercel serverless functions are stateless
- SQLite won't work in production (file system is read-only)
- Consider using a managed database (PostgreSQL, MongoDB, etc.)
- For this simple Hello World app, no database is needed

## Updating Your Deployment

After pushing changes to your repository:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically redeploy your application.

## Custom Domain

To add a custom domain:
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `ALLOWED_HOSTS` environment variable to include your domain

## Testing Locally Before Deployment

1. Start Django backend:
   ```bash
   source venv/bin/activate
   python manage.py runserver
   ```

2. Start React frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Visit http://localhost:3000 to see "Hello World"

## Next Steps

After successful deployment:
- Add a custom domain
- Set up a production database if needed
- Configure monitoring and analytics
- Set up continuous deployment
- Add more features to your app
