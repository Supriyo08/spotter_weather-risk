from unittest import TestCase

from apps.routing.services.risk import RiskLevel, Weather, assess_weather


class WeatherRiskTests(TestCase):
    def test_wind_thresholds(self):
        cases = [
            (0, 0),
            (24.99, 0),
            (25, 1),
            (34.99, 1),
            (35, 2),
            (44.99, 2),
            (45, 3),
            (54.99, 3),
            (55, 4),
            (70, 4),
        ]
        for wind, expected in cases:
            with self.subTest(wind=wind):
                self.assertEqual(assess_weather(Weather(wind, 0, 0), 0).level, expected)

    def test_rain_thresholds(self):
        cases = [
            (0.099, 0),
            (0.10, 1),
            (0.249, 1),
            (0.25, 2),
            (0.499, 2),
            (0.50, 3),
            (1.00, 3),
            (1.001, 4),
        ]
        for rain, expected in cases:
            with self.subTest(rain=rain):
                self.assertEqual(assess_weather(Weather(0, rain, 0), 0).level, expected)

    def test_snow_thresholds(self):
        cases = [
            (0.499, 0),
            (0.5, 1),
            (0.999, 1),
            (1.0, 2),
            (1.999, 2),
            (2.0, 3),
            (3.0, 3),
            (3.001, 4),
        ]
        for snow, expected in cases:
            with self.subTest(snow=snow):
                self.assertEqual(assess_weather(Weather(0, 0, snow), 0).level, expected)

    def test_load_rules_use_strict_weight_boundaries(self):
        cases = [
            (45, 30000, 3),
            (45, 30001, 4),
            (35, 40000, 2),
            (35, 40001, 3),
            (34.99, 50000, 1),
            (55, 0, 4),
            (55, 50000, 4),
        ]
        for wind, load, expected in cases:
            with self.subTest(wind=wind, load=load):
                self.assertEqual(assess_weather(Weather(wind, 0, 0), load).level, expected)

    def test_worst_condition_wins(self):
        result = assess_weather(Weather(35, 1.01, 0), 40001)
        self.assertEqual(result.level, RiskLevel.NO_TRAVEL)
        self.assertEqual(result.wind, RiskLevel.SEVERE)
        self.assertTrue(result.load_rule_applied)

    def test_invalid_values_are_rejected(self):
        for value in (-1, float("nan"), float("inf")):
            for field in ("wind_mph", "rain_inches_per_hour", "snow_inches_per_hour"):
                with self.subTest(value=value, field=field), self.assertRaises(ValueError):
                    values = dict(wind_mph=0, rain_inches_per_hour=0, snow_inches_per_hour=0)
                    values[field] = value
                    assess_weather(Weather(**values), 0)
            with self.subTest(load=value), self.assertRaises(ValueError):
                assess_weather(Weather(0, 0, 0), value)
