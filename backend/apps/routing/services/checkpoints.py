from bisect import bisect_right
from dataclasses import dataclass
from datetime import datetime, timedelta
from itertools import accumulate

from ..providers.routing import RoadRoute

METERS_PER_MILE = 1609.344


@dataclass(frozen=True)
class Checkpoint:
    latitude: float
    longitude: float
    distance_miles: float
    eta: datetime


def sample_checkpoints(
    route: RoadRoute, spacing_miles: int, departure: datetime
) -> list[Checkpoint]:
    if spacing_miles not in (10, 25, 50):
        raise ValueError("Checkpoint spacing must be 10, 25, or 50 miles.")
    distances = [0, *accumulate(route.distances)]
    durations = [0, *accumulate(route.durations)]
    spacing = spacing_miles * METERS_PER_MILE
    targets = [i * spacing for i in range(int(route.distance_meters // spacing) + 1)]
    if route.distance_meters - targets[-1] > 0.01:
        targets.append(route.distance_meters)
    else:
        targets[-1] = route.distance_meters
    points = []
    for distance in targets:
        if distance == 0:
            longitude, latitude = route.coordinates[0]
            seconds = 0
        elif distance == route.distance_meters:
            longitude, latitude = route.coordinates[-1]
            seconds = route.duration_seconds
        else:
            index = min(bisect_right(distances, distance) - 1, len(route.distances) - 1)
            fraction = (distance - distances[index]) / route.distances[index]
            start, end = route.coordinates[index : index + 2]
            longitude = start[0] + (end[0] - start[0]) * fraction
            latitude = start[1] + (end[1] - start[1]) * fraction
            seconds = durations[index] + route.durations[index] * fraction
        points.append(
            Checkpoint(
                latitude,
                longitude,
                distance / METERS_PER_MILE,
                departure + timedelta(seconds=seconds),
            )
        )
    return points
