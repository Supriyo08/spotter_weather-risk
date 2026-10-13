# spotter_weather-risk

A clean starting point for the weather-aware truck routing assessment, built with React, TypeScript, and Django REST Framework.

## What's ready

- Responsive risk workspace connected to Django, with sample scenarios, loading states, field validation, and reset controls.
- Visual risk scale, per-condition explanations, methodology reference, and an honest implementation roadmap.
- Weather and load-weight risk rules, isolated from Django.
- Distance-weighted route summaries and ordered route recommendation logic.
- Boundary, recommendation, and API tests.
- TypeScript, ESLint, Prettier, and Ruff configuration.

This is a starter, not the completed assessment. Live routing, geocoding, weather forecasts, checkpoint sampling, maps, and the forecast heatmap are the next milestones. No synthetic route or weather results are presented as live data.

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
    services/
      risk.py              Weather classification and load adjustments
      recommendation.py    Route summaries and ranking
    serializers.py         Incoming API validation
    views.py               Thin request/response handlers
    urls.py                Routing API endpoints
    tests/                 Core logic and API tests
frontend/
  src/
    app/                   Navigation, app shell, and responsive styles
    components/            Shared icon component
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

1. Open the risk workspace and select **Clear conditions**. The API returns Low.
2. Select **Heavy load + wind**. At 38 mph and 42,000 lb, the cargo rule raises wind risk to Severe.
3. Select **Severe weather**. At 56 mph, the result is No Travel.
4. Edit a field to clear the previous result, then select **Assess checkpoint**.
5. Open **Risk methodology** to review thresholds and **Build roadmap** to see implemented and planned work.

Sample scenarios are manual inputs passed to the real API; they are not live weather forecasts.

## API

- `GET /api/health/` returns `{ "status": "ok" }`.
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
