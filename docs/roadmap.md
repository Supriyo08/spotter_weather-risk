# Build order

## 1. Trip input and routing

Add origin, destination, departure time, load weight, and 10/25/50-mile spacing inputs. Send timezone-aware departure timestamps to a new planning endpoint. Select geocoding and routing providers after checking their coverage, quotas, and alternative-route support.

Completion check: return three genuinely distinct alternatives when the provider supports them; clearly report fewer alternatives rather than duplicating routes. Preserve geometry, distances, and segment travel times.

## 2. Checkpoints and weather

Sample along road geometry at the selected mile interval, including the origin and destination. Calculate checkpoint ETAs from accumulated route travel time. Fetch the forecast covering each ETA, convert units explicitly, and apply the existing risk service.

Completion check: test a short route, a partial final segment, different spacing choices, timezone offsets, and an arrival beyond the forecast horizon. Missing forecasts are unavailable data, not Low risk. Define and document how checkpoint readings assign risk to the intervening road segments before calling `summarize_route`.

## 3. Map and recommendation

Render route lines, checkpoints, ETAs, risk levels, and summaries. Use the existing ranking service after weather has been assigned to route segments. Make the recommended route easy to identify and allow selection of every alternative.

Completion check: No Travel routes cannot win. All-blocked and missing-weather cases have explicit UI states. Ranking follows the brief's priority order rather than an arbitrary weighted score.

## 4. Corridor heatmap

Sample a spatial grid around the trip corridor and display forecast weather from hour 0 through 48. Bound sample counts, cache provider results, and avoid making a new request for every slider movement.

Completion check: hour changes update the weather layer smoothly. Display the selected forecast time and weather legend, and distinguish missing data from low values. Keep departure-time route assessments distinct from the exploratory forecast slider.

## 5. Delivery

Add integration tests with recorded provider fixtures, responsive map checks, production hosting configuration, and deployment instructions. Publish to GitHub and a hosting provider when requested, then record the 5–10 minute walkthrough described in the brief.
