# 🪴 MindGarden AI

**Tagline:** Grow your habits. Cultivate your mind.

## Problem

People don't fail because they lack goals. They fail because they lack consistent systems and gentle feedback. Existing habit trackers are passive checklists—they don't adapt to your mood, your energy, or your real schedule.

## Solution

MindGarden AI is an adaptive productivity assistant that turns your habits, mood, and tasks into a living digital garden. As you complete tasks and care for yourself, your garden blooms from winter to spring—with AI that reschedules, suggests routines, and reflects on your week like a personal coach.

## 🏗️ Architecture

### High-Level Overview

```
[ React + Vite + MUI Frontend ]
        |
        |  HTTPS (REST, JSON)
        v
[ FastAPI Backend ]
   |        |        \
   |        |         \
   v        v          v
[ MongoDB ] [ OpenAI ] [ Google Calendar ]
 (habits,     (AI        (tasks sync,
  tasks,       coach,     availability)
  moods,       schedule
  logs)        optimizer)
```

### 4 Core Layers:

1. **Client (React + Vite + MUI)**

   - UI screens, garden visualization, charts, animations (Lottie / Framer Motion)

2. **API Layer (FastAPI)**

   - Auth, CRUD, AI endpoints, analytics

3. **Data & AI Layer**

   - MongoDB for storage, OpenAI for reasoning, simple rule-based bloom logic

4. **Integrations**
   - Google Calendar API for smart scheduling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)
- Google Cloud Console account (for Calendar API)
- OpenAI API key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📱 Features

- **🌱 Adaptive Garden Visualization**: Watch your habits grow from winter to spring
- **🤖 AI Coach**: Personalized scheduling and weekly reflections
- **📅 Smart Scheduling**: AI-powered task optimization with Google Calendar sync
- **🎭 Mood Tracking**: Voice and text mood logging with insights
- **📊 Garden Analytics**: Track your garden health score and habit patterns

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Material-UI, Framer Motion, Lottie
- **Backend**: FastAPI, Python, Pydantic
- **Database**: MongoDB
- **AI**: OpenAI GPT-4
- **Auth**: Google OAuth 2.0
- **Calendar**: Google Calendar API
- **Deployment**: (TBD based on hackathon requirements)

## 📊 Data Model

### Collections

- `users` - User authentication and profile data
- `habits` - User habits with frequency and targets
- `tasks` - Tasks with AI scheduling capabilities
- `mood_logs` - Mood and energy tracking
- `habit_logs` - Daily habit completion records

## 🌟 Key Differentiators

1. **Adaptive AI**: Learns your patterns and adapts to your mood/energy
2. **Beautiful Garden Metaphor**: Makes productivity feel rewarding and visual
3. **Gentle Feedback**: Coaching that motivates rather than punishes
4. **Smart Integration**: Seamlessly works with your existing Google Calendar

## 📈 Future Enhancements

- Voice commands for hands-free habit logging
- Team gardens for shared goals
- Wearable device integrations
- Advanced analytics and insights

## 🏆 Hackathon Impact

MindGarden AI addresses the fundamental problem of consistency in personal development by making habit tracking adaptive, beautiful, and emotionally engaging. Unlike static checklist apps, it grows with you, celebrates your progress, and provides intelligent coaching to keep you on track.

---

Built with ❤️ for better habits and mindful productivity.
