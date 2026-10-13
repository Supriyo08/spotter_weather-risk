from dataclasses import asdict

from django.utils import timezone

from ..providers.http import ProviderError
from ..providers.routing import find_routes
from ..providers.weather import fetch_forecasts
from .checkpoints import sample_checkpoints
from .recommendation import RouteSegment, recommend_route, summarize_route
from .risk import RiskLevel, assess_weather


def plan_trip(origin, destination, departure, load_weight_lb, spacing_miles):
    roads = find_routes(origin, destination)
    if any(road.distance_meters > 2_400_000 for road in roads):
        raise ProviderError("This demo supports routes up to 1,490 miles. Choose a shorter trip.")
    samples = [sample_checkpoints(road, spacing_miles, departure) for road in roads]
    forecasts = iter(fetch_forecasts([point for points in samples for point in points]))
    routes, eligible_summaries = [], []
    for index, (road, points) in enumerate(zip(roads, samples, strict=True)):
        checkpoints, risks = [], []
        for point in points:
            forecast = next(forecasts)
            assessment = (
                assess_weather(forecast.weather, load_weight_lb) if forecast.weather else None
            )
            risks.append(assessment.level if assessment else None)
            checkpoints.append(
                {
                    **asdict(point),
                    "eta": point.eta.isoformat(),
                    "weather": asdict(forecast.weather) if forecast.weather else None,
                    "forecast_time": forecast.forecast_time.isoformat()
                    if forecast.forecast_time
                    else None,
                    "risk": assessment.level.name.lower() if assessment else "unavailable",
                    "risk_label": assessment.level.label if assessment else "Unavailable",
                    "load_rule_applied": assessment.load_rule_applied if assessment else False,
                    "unavailable_reason": forecast.reason,
                }
            )
        route_id = f"route-{index + 1}"
        complete = all(risk is not None for risk in risks)
        summary = None
        if complete:
            # Assign each interval the worse of its two sampled endpoints.
            segments = [
                RouteSegment(
                    right.distance_miles - left.distance_miles, max(risks[i], risks[i + 1])
                )
                for i, (left, right) in enumerate(zip(points, points[1:], strict=False))
            ]
            summary = summarize_route(route_id, road.duration_seconds / 60, segments)
            eligible_summaries.append(summary)
        routes.append(
            {
                "id": route_id,
                "name": f"Route {index + 1}",
                "distance_miles": road.distance_meters / 1609.344,
                "duration_minutes": road.duration_seconds / 60,
                "arrival": points[-1].eta.isoformat(),
                "geometry": road.coordinates,
                "checkpoints": checkpoints,
                "weather_complete": complete,
                "has_no_travel": RiskLevel.NO_TRAVEL in risks,
                "summary": asdict(summary) if summary else None,
            }
        )
    recommended = recommend_route(eligible_summaries)
    warnings = []
    if len(routes) < 3:
        warnings.append(
            f"The routing provider returned {len(routes)} distinct route(s), not three."
        )
    if any(not r["weather_complete"] for r in routes):
        warnings.append("Routes with missing forecasts are excluded from recommendations.")
    if recommended is None:
        warnings.append(
            "No recommendation: every route has No Travel conditions or incomplete weather."
        )
    return {
        "origin": origin,
        "destination": destination,
        "departure": departure.isoformat(),
        "spacing_miles": spacing_miles,
        "load_weight_lb": load_weight_lb,
        "routes": routes,
        "recommended_route_id": recommended.route_id if recommended else None,
        "warnings": warnings,
        "generated_at": timezone.now().isoformat(),
    }
