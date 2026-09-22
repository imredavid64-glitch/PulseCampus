# PulseCampus

AI-powered, real-time hyperlocal campus mutual aid and study pod engine.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Leaflet, Supabase Realtime
- **Backend**: FastAPI, Python 3.11+, Google Gemini AI (gemini-2.5-flash)
- **Database**: Supabase (PostgreSQL + PostGIS + Realtime WebSockets)

## Project Structure

```
PulseCampus/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # AsyncPG pool + Supabase client
│   │   ├── schemas.py           # Pydantic models
│   │   ├── ai_engine.py         # Gemini AI integration
│   │   └── routes/
│   │       ├── pulses.py        # Pulse CRUD + spatial queries
│   │       └── pods.py          # Study pod CRUD + AI matching
│   ├── requirements.txt
│   ├── .env.example
│   └── schema.sql               # PostGIS schema
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main dashboard
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── CampusMap.tsx    # Interactive Leaflet map
│   │   │   ├── PulseList.tsx    # Realtime pulse feed
│   │   │   ├── PulseModal.tsx   # Create pulse form
│   │   │   └── StudyPodMatcher.tsx
│   │   └── lib/
│   │       └── supabase.ts      # Supabase client + types
│   ├── package.json
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account (free tier)
- Google Gemini API key

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `backend/schema.sql`
3. Get your credentials from Settings → API:
   - Project URL
   - Anon key (for frontend)
   - Service role key (for backend)

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Environment Variables

**Backend (.env):**
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_LAT=37.7245
NEXT_PUBLIC_DEFAULT_LNG=-122.4773
NEXT_PUBLIC_DEFAULT_ZOOM=16
```

## API Endpoints

### Pulses
- `POST /api/pulses` - Create pulse (AI-parsed)
- `GET /api/pulses/nearby?lat=&lng=&radius_meters=1000` - Get nearby active pulses
- `GET /api/pulses/{id}` - Get single pulse

### Study Pods
- `POST /api/pods` - Create study pod
- `GET /api/pods?course_code=` - List pods
- `POST /api/pods/match` - AI-powered pod matching
- `POST /api/pods/{id}/join` - Join a pod

## Features

### Pulse System
- **AI Parsing**: Gemini 2.5 Flash extracts category, urgency, expiration, safety flags
- **Categories**: Academic, BorrowGear, FoodSharing, SafetyEscort, GeneralHelp
- **Urgency Levels**: Critical (15-30m), High (30-90m), Medium (60-180m), Low (120-360m)
- **Safety Filtering**: Auto-blocks academic dishonesty, illegal acts, dangerous requests
- **Spatial Queries**: PostGIS `ST_DWithin` for radius-based search
- **Realtime Updates**: Supabase WebSockets for live feed

### Study Pod Matcher
- **Skill-based Matching**: AI analyzes strong/needed skills overlap
- **Course Filtering**: Match within same course
- **Capacity Management**: Track current/max participants
- **Real-time Joining**: Instant capacity updates

### Map Visualization
- **Color-coded Pins**: Red (Critical), Orange (High), Blue (Medium), Green (Low)
- **Category Icons**: Visual distinction by pulse type
- **Popups**: Summary, urgency, time remaining
- **User Location**: Blue pulsing marker with geolocation

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Set Root Directory: `frontend`
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your backend URL)
5. Deploy

### Backend → Render

1. Create new Web Service on Render
2. Connect GitHub repo
3. Set Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DATABASE_URL`
   - `FRONTEND_URL` (your Vercel URL)

### Supabase

Already hosted - just ensure RLS policies are enabled (run schema.sql).

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run lint
```

### Database Migrations

For schema changes, create migration files and run via Supabase CLI or SQL Editor.

## License

MIT License - Built for hackathon MVP.