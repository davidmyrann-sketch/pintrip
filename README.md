# PinTrip

Travel inspiration → trip plan in seconds.

## Tech stack
- **Backend**: Flask + SQLAlchemy + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Maps**: Mapbox GL JS
- **Auth**: JWT (Flask-JWT-Extended)
- **Deploy**: Railway + GitHub

## Setup

```bash
# 1. Clone & install backend
pip install -r requirements.txt

# 2. Install & build frontend
cd frontend
npm install
npm run build
cd ..

# 3. Set env vars (copy .env.example → .env)
cp .env.example .env
# Edit .env with your values

# 4. Run
python app.py

# 5. Seed demo data (first time only)
curl -X POST http://localhost:5000/api/seed
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway provides) |
| `JWT_SECRET_KEY` | Yes | Long random string |
| `VITE_MAPBOX_TOKEN` | Yes | Mapbox public token (free at mapbox.com) |

## Get a Mapbox token
1. Sign up at mapbox.com (free)
2. Copy your public token
3. Add to `.env`: `VITE_MAPBOX_TOKEN=pk.xxxx`

## Deploy to Railway
1. Push to GitHub
2. New Railway project → Deploy from GitHub
3. Add PostgreSQL service
4. Set env vars: `JWT_SECRET_KEY`, `VITE_MAPBOX_TOKEN`
5. Deploy

## GDPR
- Cookie consent banner on first visit
- Privacy policy at `/privacy`
- Data export: Settings → Export my data
- Account deletion: Settings → Delete account
- No tracking without consent
