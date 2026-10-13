from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import UTC, datetime
from math import ceil, isfinite

from ..services.checkpoints import Checkpoint
from ..services.risk import Weather
from .http import ProviderError, get_json


@dataclass(frozen=True)
class Forecast:
    weather: Weather | None
    forecast_time: datetime | None
    reason: str | None = None


def forecast_at(data: dict, eta: datetime) -> Forecast:
    try:
        hour = ceil(eta.timestamp() / 3600) * 3600
        hourly = data["hourly"]
        index = hourly["time"].index(hour)
        units = data["hourly_units"]
        values = {
            name: hourly[name][index]
            for name in (
                "wind_speed_10m",
                "rain",
                "showers",
                "snowfall",
            )
        }
        if any(v is None or not isfinite(v) or v < 0 for v in values.values()):
            raise ValueError("Missing weather")
        if units["wind_speed_10m"] != "mp/h":
            raise ValueError("Unexpected wind units")
        factors = {"inch": 1, "mm": 1 / 25.4, "cm": 1 / 2.54}
        rain = sum(values[n] * factors[units[n]] for n in ("rain", "showers"))
        snow = values["snowfall"] * factors[units["snowfall"]]
        return Forecast(
            Weather(values["wind_speed_10m"], rain, snow), datetime.fromtimestamp(hour, UTC)
        )
    except (KeyError, IndexError, TypeError, ValueError, AttributeError):
        return Forecast(None, None, "Forecast missing or arrival outside the available forecast.")


def fetch_batch(points: list[Checkpoint]) -> list[Forecast]:
    try:
        data = get_json(
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": ",".join(str(round(p.latitude, 5)) for p in points),
                "longitude": ",".join(str(round(p.longitude, 5)) for p in points),
                "hourly": "wind_speed_10m,rain,showers,snowfall",
                "wind_speed_unit": "mph",
                "precipitation_unit": "inch",
                "timezone": "UTC",
                "timeformat": "unixtime",
                "forecast_days": 7,
            },
            "Weather forecast",
        )
        locations = data if isinstance(data, list) else [data]
        if len(locations) != len(points):
            raise ProviderError("Weather provider returned incomplete locations.")
        return [forecast_at(item, point.eta) for item, point in zip(locations, points, strict=True)]
    except ProviderError as error:
        return [Forecast(None, None, str(error)) for _ in points]


def fetch_forecasts(points: list[Checkpoint]) -> list[Forecast]:
    batches = [points[i : i + 50] for i in range(0, len(points), 50)]
    with ThreadPoolExecutor(max_workers=4) as executor:
        return [forecast for batch in executor.map(fetch_batch, batches) for forecast in batch]
