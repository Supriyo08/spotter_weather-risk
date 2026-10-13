# spotter_weather-risk

A weather-aware trip planner for the weather-aware truck routing assessment, built with React, TypeScript, and Django REST Framework.

## What's ready

- Responsive risk workspace connected to Django, with sample scenarios, loading states, field validation, and reset controls.
- Visual risk scale, per-condition explanations, methodology reference, and an honest implementation roadmap.
- Weather and load-weight risk rules, isolated from Django.
- Distance-weighted route summaries and ordered route recommendation logic.
- City search, road route alternatives, checkpoint ETAs, and live hourly forecasts.
- Route comparison with exposure summaries and a checkpoint weather breakdown.
- Boundary, recommendation, provider adapter, checkpoint, and API tests.
- TypeScript, ESLint, Prettier, and Ruff configuration.

Live geocoding, routing, arrival-time weather, and route comparison are implemented. Interactive route maps and the corridor forecast heatmap remain planned. No synthetic routes or weather are presented as live data.

## Run locally

Use Python 3.12+ and Node.js 22.12+.

From the repository root, start the backend:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
python manage.py runserver
```

In a second terminal, start the frontend:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to Django at `127.0.0.1:8000`. Both servers must be running. No database migrations or API keys are needed for this starter.

The local `.env` is ignored by Git. The example key is for local development only; deployment needs a unique secret, `DJANGO_DEBUG=false`, and explicit allowed hosts. Vite's proxy only applies to development. In production, Django and WhiteNoise serve the frontend and API together.

## Folder structure

```text
backend/
  config/                  Django settings and root URLs
  apps/routing/
    providers/             Geocoding, OSRM routing, weather, and cached HTTP
    services/
      risk.py              Weather classification and load adjustments
      recommendation.py    Route summaries and ranking
      checkpoints.py       Distance sampling and segment-based ETA interpolation
      planning.py          Provider orchestration and route assessment
    serializers.py         Incoming API validation
    views.py               Thin request/response handlers
    urls.py                Routing API endpoints
    tests/                 Core logic and API tests
frontend/
  src/
    app/                   Navigation, app shell, and responsive styles
    components/            Shared icon component
    features/planner/      City search, trip inputs, comparison, and checkpoints
    features/project/      Methodology and implementation roadmap
    features/risk/
      components/          Risk form and result display
      api.ts               Feature-specific API calls
      types.ts             Request and response types
    lib/api.ts             Shared HTTP client and error handling
docs/
  architecture.md          Code conventions and extension points
  roadmap.md               Next milestones and completion checks
```

## Checks

From `backend/` with the virtual environment activated:

```sh
python manage.py check
python manage.py test apps.routing.tests
ruff check .
ruff format --check .
```

From `frontend/`:

```sh
npm run lint
npm run format:check
npm run build
```

## Two-minute review

1. Open **Trip planner**, search and select Chicago and Indianapolis, then compare routes. Review checkpoint arrival times, weather, and the recommended route.
2. Open the risk workspace and select **Clear conditions**. The API returns Low.
3. Select **Heavy load + wind**. At 38 mph and 42,000 lb, the cargo rule raises wind risk to Severe.
4. Select **Severe weather**. At 56 mph, the result is No Travel.
5. Edit a field to clear the previous result, then select **Assess checkpoint**.
6. Open **Risk methodology** to review thresholds and **Build roadmap** to see implemented and planned work.

Sample scenarios are manual inputs passed to the real API; they are not live weather forecasts.

## API

- `GET /api/health/` returns `{ "status": "ok" }`.
- `GET /api/locations/?q=Chicago` returns selectable city coordinates.
- `POST /api/trips/plan/` accepts `origin` and `destination` objects (`name`, `latitude`, `longitude`), an ISO 8601 `departure` with timezone, `load_weight_lb`, and `spacing_miles` (10, 25, or 50). It returns route geometry, checkpoints, forecast availability, risk summaries, and a recommended route ID.
- `POST /api/risk/evaluate/` evaluates one set of weather readings and a load weight.

```sh
curl http://127.0.0.1:8000/api/risk/evaluate/ \
  -H 'Content-Type: application/json' \
  -d '{"wind_mph":45,"rain_inches_per_hour":0,"snow_inches_per_hour":0,"load_weight_lb":30001}'
```

The response includes the overall risk, individual condition levels, and whether a load rule raised wind risk. Invalid inputs return HTTP 400 with field errors. Input bounds are validation guardrails, not weather thresholds.

## Risk decisions

The brief overlaps rain/snow endpoints. At shared boundaries, this starter chooses the higher risk: rain `0.25` is High and `0.50` is Severe; snow `1.0` is High and `2.0` is Severe. The explicit No Travel rules stay strictly `>1.00` rain and `>3.0` snow.

Wind uses continuous intervals: `<25`, `[25,35)`, `[35,45)`, `[45,55)`, and `>=55` mph. Load thresholds are strictly greater than 30,000 and 40,000 lb, as written in the brief. The worst adjusted condition sets checkpoint risk.

The recommendation service rejects routes containing any No Travel segment. Among the remaining routes it compares, in order: Severe miles, High miles, distance-weighted average risk, and travel time. If none are eligible, it returns `None`. Equal rankings preserve input order. Segment distances must be positive; risk scores run from 0 (Low) to 4 (No Travel).

Framework references: [Vite setup](https://vite.dev/guide/), [Django compatibility](https://docs.djangoproject.com/en/5.2/faq/install/), and [DRF validation](https://www.django-rest-framework.org/api-guide/serializers/#validation).

## Deployment

The project includes a Dockerfile, Railway configuration, and Render Blueprint for a single service. See [deployment instructions](docs/deployment.md) for setup, environment variables, and verification.

## Live provider decisions

City search and forecasts use [Open-Meteo](https://open-meteo.com/en/docs); road routes use the public [OSRM driving API](https://project-osrm.org/docs/v5.22.0/api/) with OpenStreetMap data. No keys are required for this demonstration. These public services have usage limits and no production availability guarantee; choose suitable commercial or self-hosted services before wider production use. Set `OSRM_BASE_URL` to use another compatible OSRM host.

The planner requests two alternatives plus the primary route, deduplicates identical geometry, and reports when fewer than three are returned. OSRM driving routes do not account for truck dimensions, weight restrictions, live traffic, or driver rest breaks.

Checkpoints follow the road geometry and accumulated segment travel times, including both endpoints. Precipitation uses the hourly interval containing arrival (the preceding interval for an exact hour); wind uses that interval’s ending reading. Rain includes showers. Units are validated and converted explicitly. The worse of two endpoint risks applies to their intervening distance. Unsampled conditions may differ.

Departure is limited to the next six days and routes to approximately 1,490 miles. Forecast coverage is seven days from the provider’s current day, so late arrivals may have no forecast. Missing weather remains unavailable and excludes that route from recommendations. No Travel routes are also excluded.

Provider responses are cached for 10 minutes (weather), 30 minutes (routes), or one day (city search). Forecast requests batch up to 50 locations with four concurrent batches. Basic anonymous throttles allow 30 location searches and six plans per minute per client IP. Cache and throttle state are process-local; use a shared cache and gateway limits when scaling.
