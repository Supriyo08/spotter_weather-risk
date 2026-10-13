# Implementation status

## Completed: trip input and routing

City selection via Open-Meteo geocoding, timezone-aware departure, load weight, and 10/25/50-mile spacing. OSRM requests a primary route and two alternatives, preserves road geometry and timing, and reports fewer routes honestly.

## Completed: checkpoints and weather

Distance sampling includes origin and destination. ETAs use accumulated road-segment travel times. Batched forecasts use the hourly interval containing each arrival, with explicit units and missing-data handling. Tests cover geometry, timing, partial intervals, zero-distance edges, forecast boundaries, outages, and route eligibility.

## Completed: comparison and recommendation

Selectable route cards show distance, time, exposure, and ranking. A checkpoint table shows ETA, forecast time, conditions, cargo adjustments, and risk. No Travel and incomplete routes cannot win.

## Next: interactive route map

Render returned route geometry, checkpoint markers, risk colors, and selected-route emphasis. Synchronize map selection with comparison cards and the weather table. Verify mobile interaction and keyboard access.

## Next: corridor heatmap

Sample a bounded spatial grid around the corridor and display hourly forecasts from hour 0 through 48. Cache the forecast set, distinguish unavailable data, and keep exploratory slider times separate from route arrival-time assessment.

## Later: operational readiness

Use production provider agreements or self-hosted routing, shared caching and rate limits, observability, and saved trips if required. Truck-aware routing requires a provider with restriction data; current road-driving estimates are an explicit limitation.
