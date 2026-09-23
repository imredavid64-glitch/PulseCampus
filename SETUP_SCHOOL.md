# Setting Up PulseCampus for Your School

This guide walks you through adapting PulseCampus for any college/university campus in 15 minutes.

---

## Quick Start (5 minutes)

### 1. Fork & Clone
```bash
git clone https://github.com/your-org/PulseCampus
cd PulseCampus
```

### 2. Configure Your School
Copy the example config and customize:
```bash
cp config/school.example.py config/school.py
# Edit config/school.py with your campus details
```

### 3. Configure Frontend (optional - uses same env vars)
The frontend reads from environment variables. Add to `.env.local`:
```env
NEXT_PUBLIC_SCHOOL_NAME="Your University Pulse"
NEXT_PUBLIC_SCHOOL_SHORT_NAME="UniPulse"
NEXT_PUBLIC_SCHOOL_DEFAULT_LAT=40.7128
NEXT_PUBLIC_SCHOOL_DEFAULT_LNG=-74.0060
NEXT_PUBLIC_SCHOOL_DEFAULT_ZOOM=16
NEXT_PUBLIC_SCHOOL_PRIMARY_COLOR=#1e40af
NEXT_PUBLIC_SCHOOL_SECONDARY_COLOR=#16a34a
NEXT_PUBLIC_SCHOOL_LOGO_EMOJI=🏫
```

### 4. Deploy
- **Frontend**: Vercel (connect GitHub, set root to `frontend/`)
- **Backend**: Render (connect GitHub, set root to `backend/`)
- **Database**: Supabase (run `backend/schema.sql` then `backend/seed.sql`)

---

## Detailed Configuration

### Backend Config (`config/school.py`)

```python
from app.school_config import SchoolConfig

SCHOOL_CONFIG = SchoolConfig(
    # REQUIRED - Basic identity
    name="Your University Pulse",
    short_name="UniPulse",
    domain="your-university.edu",
    
    # REQUIRED - Campus map center (find on Google Maps)
    default_lat=40.7128,      # Your campus latitude
    default_lng=-74.0060,     # Your campus longitude
    default_zoom=16,          # 15-17 works well for campus
    
    # OPTIONAL - Restrict map to campus bounds
    # map_bounds=[[south, west], [north, east]]
    # map_bounds=[[40.7000, -74.0200], [40.7200, -73.9900]],
    
    # REQUIRED - Your actual building names
    buildings=[
        "Main Library",
        "Student Center",
        "Engineering Hall",
        "Science Building",
        "Business School",
        "Arts & Humanities",
        "Residence Hall A",
        "Residence Hall B",
        "Recreation Center",
        "Health Services",
        "Parking Garage",
        "Central Quad",
        "Computer Lab",
        "Study Commons",
    ],
    
    # REQUIRED - Your actual course codes
    courses=[
        "CS 101", "CS 201", "CS 301", "CS 401",
        "MATH 101", "MATH 201", "MATH 301",
        "PHYS 101", "PHYS 201",
        "CHEM 101", "CHEM 201",
        "BIO 101", "BIO 201",
        "ECON 101", "ECON 201",
        "PSYC 101", "PSYC 201",
        "STAT 101", "STAT 201",
        "ENG 101", "ENG 201",
        # Add YOUR school's course codes
    ],
    
    # OPTIONAL - Customize categories for your campus culture
    categories=[
        {"value": "Academic", "label": "📚 Academic", "desc": "Homework, exams, study help"},
        {"value": "BorrowGear", "label": "🔧 Borrow Gear", "desc": "Calculators, chargers, lab equipment"},
        {"value": "FoodSharing", "label": "🍕 Food Sharing", "desc": "Extra meals, snacks, event food"},
        {"value": "SafetyEscort", "label": "🛡️ Safety Escort", "desc": "Walk home, campus safety, late night"},
        {"value": "GeneralHelp", "label": "🤝 General Help", "desc": "Anything else you need"},
        # Add campus-specific:
        # {"value": "RideShare", "label": "🚗 Ride Share", "desc": "Carpool to campus, airport runs"},
        # {"value": "EventBuddy", "label": "🎪 Event Buddy", "desc": "Find people for events, clubs"},
    ],
    
    # Branding
    primary_color="#1e40af",      # Your school primary color (hex)
    secondary_color="#16a34a",    # Your school secondary color (hex)
    logo_emoji="🏫",              # Emoji or use custom logo
)
```

### Finding Your Campus Coordinates

1. Go to [Google Maps](https://maps.google.com)
2. Search for your campus
3. Right-click the center of campus → "What's here?"
4. Copy the latitude/longitude (e.g., `40.7128, -74.0060`)

### Customizing Categories

Each category needs:
- `value`: Database identifier (no spaces, PascalCase)
- `label`: Emoji + display name
- `desc`: Short description for users

The AI will classify pulses into these categories automatically.

### Customizing Urgency Levels

Default expiration times:
| Urgency | Color | Default Expiration |
|---------|-------|-------------------|
| Critical | Red (#dc2626) | 15 min |
| High | Orange (#ea580c) | 60 min |
| Medium | Blue (#2563eb) | 120 min |
| Low | Green (#16a34a) | 240 min |

Override in `SchoolConfig` if needed.

---

## Frontend Config (Environment Variables)

Add to Vercel/Render environment variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SCHOOL_NAME` | "Stanford Pulse" | Full app name |
| `NEXT_PUBLIC_SCHOOL_SHORT_NAME` | "StanfordPulse" | Short name for headers |
| `NEXT_PUBLIC_SCHOOL_DEFAULT_LAT` | `37.4275` | Campus latitude |
| `NEXT_PUBLIC_SCHOOL_DEFAULT_LNG` | `-122.1697` | Campus longitude |
| `NEXT_PUBLIC_SCHOOL_DEFAULT_ZOOM` | `16` | Map zoom level |
| `NEXT_PUBLIC_SCHOOL_PRIMARY_COLOR` | `#8C1515` | Primary brand color |
| `NEXT_PUBLIC_SCHOOL_SECONDARY_COLOR` | `#FFFFFF` | Secondary brand color |
| `NEXT_PUBLIC_SCHOOL_LOGO_EMOJI` | `🌲` | Logo emoji |

---

## Database Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) → New Project
- Note your Project URL and API keys

### 2. Run Schema
In Supabase SQL Editor, run:
```sql
-- 1. schema.sql (creates tables, indexes, RLS)
-- Copy from backend/schema.sql

-- 2. seed.sql (optional - demo data)
-- Copy from backend/seed.sql
```

### 3. Enable Realtime
In Supabase Dashboard → Database → Replication:
- Enable replication for `pulses` table
- Enable replication for `study_pods` table

---

## Deploy Checklist

### Frontend (Vercel)
- [ ] Import GitHub repo
- [ ] Set Root Directory: `frontend`
- [ ] Add Environment Variables (see above)
- [ ] Deploy

### Backend (Render)
- [ ] New Web Service
- [ ] Connect GitHub repo
- [ ] Root Directory: `backend`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add Environment Variables:
  - `GEMINI_API_KEY` (from Google AI Studio)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `DATABASE_URL` (from Supabase Connection Pooling)
  - `FRONTEND_URL` (your Vercel URL)

### Supabase
- [ ] Run `backend/schema.sql`
- [ ] Run `backend/seed.sql` (optional)
- [ ] Enable Realtime for tables
- [ ] Verify RLS policies work

---

## Testing Your Deployment

1. Open your Vercel URL
2. Allow location access
3. Create a test pulse: "Test pulse from [Your School]"
4. Verify it appears on map
5. Create a study pod for a real course
6. Test realtime updates in another browser tab

---

## Common Customizations

### Add Custom Building Autocomplete
Edit `config/school.py` buildings list - these appear as datalist suggestions.

### Modify AI Prompts
Edit `backend/app/ai_engine.py`:
- `PULSE_SYSTEM_PROMPT` - How pulses are classified
- `POD_MATCH_SYSTEM_PROMPT` - How study pods are matched

### Change Map Style
In `frontend/src/components/CampusMap.tsx`, change TileLayer URL:
```tsx
// Light (default)
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

// Dark
url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"

// Satellite
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
```

### Add Authentication
Currently anonymous. To add auth:
1. Enable Supabase Auth
2. Add user_id to pulses/pods tables
3. Update RLS policies
4. Add login UI

---

## Troubleshooting

### Map not loading
- Check Leaflet CSS is imported in `globals.css`
- Verify coordinates are valid numbers

### Pulses not appearing
- Check Supabase RLS policies allow public read
- Verify `expires_at > NOW()` in query
- Check browser console for API errors

### AI parsing failing
- Verify `GEMINI_API_KEY` is set
- Check backend logs for Gemini errors
- Fallback parsing handles most cases

### Realtime not working
- Enable Replication in Supabase Dashboard
- Check WebSocket connection in browser DevTools
- Verify `supabase.channel().on('postgres_changes')` syntax

---

## File Structure for Customization

```
PulseCampus/
├── config/
│   ├── school.example.py    # Template - copy to school.py
│   └── school.py            # YOUR config (gitignored)
├── backend/
│   ├── app/
│   │   ├── school_config.py # Config loader
│   │   └── ai_engine.py     # AI prompts
│   └── seed.sql             # Demo data
└── frontend/
    └── src/
        └── lib/
            └── school-config.ts  # Frontend config
```

---

## Need Help?

- Check `README.md` for full deployment guide
- Open GitHub Issue for bugs
- See `backend/app/ai_engine.py` for AI customization

---

**Your school's PulseCampus is ready!** 🚀