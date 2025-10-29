# project3-gang-20

A React frontend with Django backend displaying "Hello World".

## Project Structure

```
project3-gang-20/
├── backend/          # Django backend
├── frontend/         # React frontend
├── venv/            # Python virtual environment
├── manage.py        # Django management script
├── requirements.txt # Python dependencies
└── vercel.json      # Vercel deployment configuration
```

## Prerequisites

- Python 3.x
- Node.js and npm
- Git

## Setup Instructions

### Backend Setup (Django)

1. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Start Django development server:
   ```bash
   python manage.py runserver
   ```
   The backend will run on http://localhost:8000

### Frontend Setup (React)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start React development server:
   ```bash
   npm start
   ```
   The frontend will run on http://localhost:3000

## Running the Project Locally

1. Open two terminal windows
2. In terminal 1: Start Django backend
   ```bash
   source venv/bin/activate
   python manage.py runserver
   ```
3. In terminal 2: Start React frontend
   ```bash
   cd frontend
   npm start
   ```
4. Visit http://localhost:3000 in your browser to see "Hello World"

## Deployment to Vercel

This project is **ready for Vercel deployment**. See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

### Quick Deploy

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects the configuration

3. **Set Environment Variables** in Vercel Dashboard:
   ```
   DJANGO_SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=.vercel.app
   ```

4. **Deploy** and visit your live site!

### What's Configured

- [vercel.json](vercel.json) - Routing between React frontend and Django backend
- [backend/settings.py](backend/settings.py) - Production-ready with environment variables
- [backend/wsgi.py](backend/wsgi.py) - Serverless function handler for Vercel
- CORS configured for cross-origin requests

## Using with Cursor

This project is fully ready to use in Cursor IDE:

1. Open the project folder in Cursor
2. The project structure is standard React + Django
3. Follow the running instructions above to start both servers
4. Edit files in [frontend/src/App.js](frontend/src/App.js) for frontend changes
5. Django backend is configured in [backend/settings.py](backend/settings.py)

## Technologies

- **Frontend**: React 18
- **Backend**: Django 4.2
- **Additional**: Django REST Framework, CORS Headers
- **Deployment**: Vercel (serverless)

## Project Files

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed Vercel deployment guide
- [requirements.txt](requirements.txt) - Python dependencies
- [vercel.json](vercel.json) - Vercel configuration
- [.gitignore](.gitignore) - Git ignore rules
