import os
from dataclasses import dataclass
from math import isfinite

from .http import ProviderError, get_json


@dataclass(frozen=True)
class RoadRoute:
    coordinates: list[list[float]]
    distances: list[float]
    durations: list[float]

    @property
    def distance_meters(self) -> float:
        return sum(self.distances)

    @property
    def duration_seconds(self) -> float:
        return sum(self.durations)


def find_routes(origin: dict, destination: dict) -> list[RoadRoute]:
    coordinates = ";".join(f"{p['longitude']},{p['latitude']}" for p in (origin, destination))
    base = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org").rstrip("/")
    data = get_json(
        f"{base}/route/v1/driving/{coordinates}",
        {
            "alternatives": 2,
            "overview": "full",
            "geometries": "geojson",
            "annotations": "distance,duration",
            "steps": "false",
        },
        "Routing",
        ttl=1800,
    )
    if isinstance(data, dict) and data.get("code") in ("NoRoute", "NoSegment"):
        raise ProviderError("No road route connects these locations. Try nearby cities.")
    try:
        if data["code"] != "Ok":
            raise ValueError("Routing failed")
        routes = []
        seen = set()
        for item in data["routes"][:3]:
            geometry = item["geometry"]["coordinates"]
            if any(
                len(point) != 2
                or not all(isfinite(v) for v in point)
                or not -180 <= point[0] <= 180
                or not -90 <= point[1] <= 90
                for point in geometry
            ):
                raise ValueError("Invalid route coordinates")
            fingerprint = tuple(tuple(point) for point in geometry)
            if fingerprint in seen:
                continue
            seen.add(fingerprint)
            distances = [d for leg in item["legs"] for d in leg["annotation"]["distance"]]
            durations = [d for leg in item["legs"] for d in leg["annotation"]["duration"]]
            if len(distances) != len(geometry) - 1 or len(durations) != len(distances):
                raise ValueError("Geometry and timing do not align")
            if any(not isfinite(v) or v < 0 for v in distances + durations):
                raise ValueError("Invalid route measurements")
            route = RoadRoute(geometry, distances, durations)
            if route.distance_meters < 1 or route.duration_seconds <= 0:
                raise ValueError("Choose locations further apart")
            routes.append(route)
        if not routes:
            raise ValueError("No routes returned")
        return routes
    except (KeyError, TypeError, ValueError) as error:
        raise ProviderError("Routing returned no usable route. Try different locations.") from error
