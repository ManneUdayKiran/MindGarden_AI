# 🚀 MindGarden AI - Quick Setup Guide

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **Python 3.9+** installed
- **MongoDB** (local installation or MongoDB Atlas account)
- **Google Cloud Console** account (for OAuth and Calendar API)
- **OpenAI API** key

## 🏗️ Project Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd "MindGarden AI"

# Install root dependencies (for concurrent dev servers)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Environment Configuration

#### Backend Environment

```bash
# Copy example environment file
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual values:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=mindgarden

# Authentication
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# CORS
FRONTEND_URL=http://localhost:5173

# Environment
ENVIRONMENT=development
```

### 3. Database Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB locally
# Windows: Download from mongodb.com
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# Start MongoDB service
mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URL` in `.env`

### 4. Google Cloud Setup

#### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google+ API
   - Google Calendar API

#### OAuth Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Set Application Type: **Web Application**
3. Add authorized origins:
   - `http://localhost:8000`
   - `http://localhost:5173`
4. Add redirect URIs:
   - `http://localhost:8000/auth/google/callback`
5. Copy Client ID and Secret to `.env`

#### Calendar API

1. In **Credentials**, create **API Key**
2. Restrict to Google Calendar API
3. Add to `.env` if needed

### 5. OpenAI Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

## 🏃‍♂️ Running the Application

### Development Mode

#### Option 1: Run Both Servers Concurrently

```bash
# From root directory
npm run dev
```

This starts both frontend (port 5173) and backend (port 8000) simultaneously.

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **API Alternative Docs:** http://localhost:8000/redoc

## 🧪 Testing the Setup

### 1. Test Backend

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "MindGarden AI API"
}
```

### 2. Test Frontend

- Open http://localhost:5173
- Should see MindGarden AI landing page
- Check browser console for any errors

### 3. Test API Endpoints

Visit http://localhost:8000/docs to explore all available endpoints.

## 🐛 Common Issues & Solutions

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod             # Linux
```

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Python Dependencies Issues

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\\Scripts\\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### Node.js Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
MindGarden AI/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── core/            # Core functionality (config, database)
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic services
│   │   └── main.py          # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── README.md                # Main documentation
├── PITCH.md                # Pitch deck content
├── SETUP.md                 # This file
└── package.json            # Root package.json for dev scripts
```

## 🎯 Next Steps

1. **Complete Authentication:**

   - Implement Google OAuth flow
   - Add JWT middleware
   - Create user sessions

2. **Database Integration:**

   - Connect MongoDB models
   - Implement CRUD operations
   - Add data validation

3. **AI Features:**

   - Integrate OpenAI API
   - Implement scheduling algorithms
   - Add mood-based recommendations

4. **Enhanced UI:**

   - Add Lottie animations
   - Implement task scheduling view
   - Create mood logging interface

5. **Testing:**
   - Add unit tests
   - Integration testing
   - User acceptance testing

## 🆘 Getting Help

- **Check the API docs:** http://localhost:8000/docs
- **Review the models:** `backend/app/models/schemas.py`
- **Frontend routing:** `frontend/src/App.jsx`
- **Database config:** `backend/app/core/database.py`

---

**Happy coding! Let's grow some digital gardens! 🌱✨**
