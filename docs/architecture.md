# Architecture

Keep business rules independent of the web framework. A request flows from a URL to a view, through a serializer, into a service, and back as JSON. Views should not contain weather thresholds or route ranking logic.

## Backend

`apps/routing` owns the routing use case. `services/risk.py` accepts typed weather values and a load weight. `services/recommendation.py` accepts already assessed route segments. Both can run without a Django server or database.

When live data is introduced, add provider adapters under `apps/routing/providers/`, such as `geocoding.py`, `routing.py`, and `weather.py`. Convert external responses to project data types there. Keep API keys, HTTP timeouts, provider-specific units, and errors inside those adapters. Do not add abstract base classes until multiple implementations need them.

Add checkpoint geometry and ETA interpolation in `services/checkpoints.py`. A `services/planning.py` module can then coordinate geocoding, routing, sampling, forecasts, and risk assessment. Keep Django views thin. These modules are planned; no empty placeholder files are needed yet.

## Frontend

Organize code by feature. Each feature owns its components, types, and API functions. Put shared infrastructure in `lib/` and the application shell in `app/`. Extract shared UI components only once multiple features use them.

React displays risk decisions returned by Django. Do not duplicate the scoring algorithm in TypeScript. The current calculator uses manual input; the future trip planner will obtain forecasts through the backend.

Use local component state first. Introduce a query/cache library when live routes and weather introduce repeated asynchronous requests. No global state manager is needed for the starter.

## Conventions

- Prefer descriptive names and small functions over explanatory comments.
- Comment only surprising decisions or constraints; document design choices here.
- Python uses `snake_case`; React components use `PascalCase`; TypeScript functions use `camelCase`.
- Include units in domain and API names: `wind_mph`, `load_weight_lb`, `distance_miles`.
- Use UTC, timezone-aware timestamps at the API boundary; localize only for display.
- Validate external input at the boundary and enforce domain invariants in services.
- Never turn unavailable forecasts into zero precipitation or Low risk.
- Keep provider credentials on the backend and out of committed files.

No persistence is needed for the current calculator. Add models and migrations when saving trips becomes a requirement, not before.
