from dataclasses import dataclass
from enum import IntEnum
from math import isfinite


class RiskLevel(IntEnum):
    LOW = 0
    MODERATE = 1
    HIGH = 2
    SEVERE = 3
    NO_TRAVEL = 4

    @property
    def label(self) -> str:
        return self.name.replace("_", " ").title()


@dataclass(frozen=True)
class Weather:
    wind_mph: float
    rain_inches_per_hour: float
    snow_inches_per_hour: float


@dataclass(frozen=True)
class RiskAssessment:
    level: RiskLevel
    wind: RiskLevel
    rain: RiskLevel
    snow: RiskLevel
    load_rule_applied: bool


def require_nonnegative(**values: float) -> None:
    for name, value in values.items():
        if not isfinite(value) or value < 0:
            raise ValueError(f"{name} must be a finite, nonnegative number.")


def precipitation_risk(value: float, thresholds: tuple[float, float, float, float]) -> RiskLevel:
    low, moderate, high, severe = thresholds
    if value < low:
        return RiskLevel.LOW
    if value < moderate:
        return RiskLevel.MODERATE
    if value < high:
        return RiskLevel.HIGH
    if value <= severe:
        return RiskLevel.SEVERE
    return RiskLevel.NO_TRAVEL


def assess_weather(weather: Weather, load_weight_lb: float) -> RiskAssessment:
    require_nonnegative(
        wind_mph=weather.wind_mph,
        rain_inches_per_hour=weather.rain_inches_per_hour,
        snow_inches_per_hour=weather.snow_inches_per_hour,
        load_weight_lb=load_weight_lb,
    )
    wind = RiskLevel(sum(weather.wind_mph >= threshold for threshold in (25, 35, 45, 55)))
    adjusted_wind = wind
    if wind == RiskLevel.SEVERE and load_weight_lb > 30_000:
        adjusted_wind = RiskLevel.NO_TRAVEL
    elif wind == RiskLevel.HIGH and load_weight_lb > 40_000:
        adjusted_wind = RiskLevel.SEVERE

    rain = precipitation_risk(weather.rain_inches_per_hour, (0.10, 0.25, 0.50, 1.00))
    snow = precipitation_risk(weather.snow_inches_per_hour, (0.5, 1.0, 2.0, 3.0))
    return RiskAssessment(
        level=max(adjusted_wind, rain, snow),
        wind=adjusted_wind,
        rain=rain,
        snow=snow,
        load_rule_applied=adjusted_wind != wind,
    )
