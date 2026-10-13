# Architecture

Keep business rules independent of the web framework. A request flows from a URL to a view, through a serializer, into a service, and back as JSON. Views should not contain weather thresholds or route ranking logic.

## Backend

`apps/routing` owns the routing use case. `services/risk.py` accepts typed weather values and a load weight. `services/recommendation.py` accepts already assessed route segments. Both can run without a Django server or database.

Provider adapters under `apps/routing/providers/` normalize geocoding, route geometry and segment timing, and hourly weather. The HTTP helper owns timeouts, caching, and provider errors. No abstract provider hierarchy is needed while each service has one implementation.

`services/checkpoints.py` interpolates coordinates and elapsed time along road segments. `services/planning.py` orchestrates routing, sampling, forecasts, assessment, and ranking. Missing forecasts exclude a route; each interval uses the worse risk of its endpoints. The HTTP views validate requests and translate provider failures to 503 responses.

## Frontend

Organize code by feature. Each feature owns its components, types, and API functions. Put shared infrastructure in `lib/` and the application shell in `app/`. Extract shared UI components only once multiple features use them.

React displays risk decisions returned by Django. Do not duplicate the scoring algorithm in TypeScript. The risk calculator uses manual inputs; the trip planner obtains live routes and forecasts through the backend.

Use local component state first. City searches discard stale responses; trip fields are disabled during planning and edits clear previous results. Introduce a query/cache library if client-side request reuse becomes necessary. No global state manager is needed for the starter.

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
