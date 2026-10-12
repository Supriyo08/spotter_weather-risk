from dataclasses import dataclass

from .risk import RiskLevel, require_nonnegative


@dataclass(frozen=True)
class RouteSegment:
    distance_miles: float
    risk: RiskLevel


@dataclass(frozen=True)
class RouteSummary:
    route_id: str
    duration_minutes: float
    distance_miles: float
    severe_miles: float
    high_miles: float
    average_risk: float
    has_no_travel: bool


def summarize_route(
    route_id: str, duration_minutes: float, segments: list[RouteSegment]
) -> RouteSummary:
    require_nonnegative(duration_minutes=duration_minutes)
    if not segments:
        raise ValueError("A route must contain at least one segment.")
    for segment in segments:
        require_nonnegative(distance_miles=segment.distance_miles)
        if segment.distance_miles == 0:
            raise ValueError("Route segments must have a positive distance.")
    distance = sum(segment.distance_miles for segment in segments)
    return RouteSummary(
        route_id=route_id,
        duration_minutes=duration_minutes,
        distance_miles=distance,
        severe_miles=sum(s.distance_miles for s in segments if s.risk == RiskLevel.SEVERE),
        high_miles=sum(s.distance_miles for s in segments if s.risk == RiskLevel.HIGH),
        average_risk=sum(s.distance_miles * s.risk for s in segments) / distance,
        has_no_travel=any(s.risk == RiskLevel.NO_TRAVEL for s in segments),
    )


def recommend_route(routes: list[RouteSummary]) -> RouteSummary | None:
    eligible_routes = [route for route in routes if not route.has_no_travel]
    return min(
        eligible_routes,
        key=lambda route: (
            route.severe_miles,
            route.high_miles,
            route.average_risk,
            route.duration_minutes,
        ),
        default=None,
    )
