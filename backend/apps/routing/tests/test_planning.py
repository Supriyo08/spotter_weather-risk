from datetime import UTC, datetime, timedelta
from unittest import TestCase
from unittest.mock import patch

from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APISimpleTestCase

from apps.routing.providers.http import ProviderError
from apps.routing.providers.routing import RoadRoute, find_routes
from apps.routing.providers.weather import Forecast, fetch_batch, forecast_at
from apps.routing.services.checkpoints import METERS_PER_MILE, sample_checkpoints
from apps.routing.services.planning import plan_trip
from apps.routing.services.risk import Weather

DEPARTURE = datetime(2026, 10, 13, 12, tzinfo=UTC)
ORIGIN = {"name": "Origin", "latitude": 0, "longitude": 0}
DESTINATION = {"name": "Destination", "latitude": 1, "longitude": 1}
ROAD = RoadRoute(
    [[0, 0], [1, 0], [1, 1]], [10 * METERS_PER_MILE, 15 * METERS_PER_MILE], [600, 1800]
)


def forecast_data(hour, wind=12, rain=0.1, showers=0.2, snow=0):
    return {
        "hourly": {
            "time": [hour],
            "wind_speed_10m": [wind],
            "rain": [rain],
            "showers": [showers],
            "snowfall": [snow],
        },
        "hourly_units": {
            "wind_speed_10m": "mp/h",
            "rain": "inch",
            "showers": "inch",
            "snowfall": "inch",
        },
    }


class CheckpointTests(TestCase):
    def test_samples_road_geometry_and_accumulated_segment_time(self):
        points = sample_checkpoints(ROAD, 10, DEPARTURE)
        self.assertEqual([round(p.distance_miles) for p in points], [0, 10, 20, 25])
        self.assertEqual(
            [round((p.eta - DEPARTURE).total_seconds()) for p in points], [0, 600, 1800, 2400]
        )
        self.assertAlmostEqual(points[2].latitude, 2 / 3)
        self.assertEqual(points[2].longitude, 1)
        self.assertEqual(points[-1].latitude, 1)

    def test_short_route_still_contains_both_endpoints(self):
        points = sample_checkpoints(ROAD, 50, DEPARTURE)
        self.assertEqual(len(points), 2)
        self.assertEqual(points[0].eta, DEPARTURE)
        self.assertEqual(points[-1].eta, DEPARTURE + timedelta(seconds=2400))

    def test_exact_spacing_does_not_duplicate_destination(self):
        self.assertEqual(len(sample_checkpoints(ROAD, 25, DEPARTURE)), 2)

    def test_zero_length_geometry_edge_does_not_divide_by_zero(self):
        road = RoadRoute([[0, 0], [0, 0], [1, 1]], [0, 12 * METERS_PER_MILE], [0, 600])
        self.assertEqual(len(sample_checkpoints(road, 10, DEPARTURE)), 3)


class ForecastTests(TestCase):
    def test_uses_precipitation_hour_containing_arrival(self):
        hour = int(DEPARTURE.timestamp()) + 3600
        result = forecast_at(forecast_data(hour), DEPARTURE + timedelta(minutes=20))
        self.assertAlmostEqual(result.weather.rain_inches_per_hour, 0.3)
        self.assertEqual(result.forecast_time.timestamp(), hour)

    def test_exact_hour_and_snow_unit_conversion(self):
        data = forecast_data(int(DEPARTURE.timestamp()), snow=2.54)
        data["hourly_units"]["snowfall"] = "cm"
        self.assertAlmostEqual(forecast_at(data, DEPARTURE).weather.snow_inches_per_hour, 1)

    def test_missing_or_out_of_horizon_is_not_low_risk(self):
        for data in (
            {},
            forecast_data(0),
            forecast_data(int(DEPARTURE.timestamp()), wind=None),
            forecast_data(int(DEPARTURE.timestamp()), rain=-1),
        ):
            with self.subTest(data=data):
                self.assertIsNone(forecast_at(data, DEPARTURE).weather)

    @patch("apps.routing.providers.weather.get_json", side_effect=ProviderError("Unavailable"))
    def test_provider_outage_keeps_checkpoints_unavailable(self, request):
        points = sample_checkpoints(ROAD, 25, DEPARTURE)
        forecasts = fetch_batch(points)
        self.assertEqual(len(forecasts), 2)
        self.assertTrue(all(f.weather is None for f in forecasts))

    @patch("apps.routing.providers.weather.get_json")
    def test_batch_response_order_matches_requested_points(self, request):
        points = sample_checkpoints(ROAD, 25, DEPARTURE)
        request.return_value = [
            forecast_data(int(DEPARTURE.timestamp()), wind=12),
            forecast_data(int(DEPARTURE.timestamp()) + 3600, wind=56),
        ]
        forecasts = fetch_batch(points)
        self.assertEqual([f.weather.wind_mph for f in forecasts], [12, 56])


class PlanningTests(TestCase):
    @patch("apps.routing.services.planning.find_routes", return_value=[ROAD])
    @patch("apps.routing.services.planning.fetch_forecasts")
    def test_destination_no_travel_blocks_entire_route(self, weather, routes):
        weather.return_value = [
            Forecast(Weather(12, 0, 0), DEPARTURE),
            Forecast(Weather(55, 0, 0), DEPARTURE),
        ]
        plan = plan_trip(ORIGIN, DESTINATION, DEPARTURE, 20000, 25)
        self.assertIsNone(plan["recommended_route_id"])
        self.assertTrue(plan["routes"][0]["has_no_travel"])

    @patch("apps.routing.services.planning.find_routes", return_value=[ROAD, ROAD])
    @patch("apps.routing.services.planning.fetch_forecasts")
    def test_incomplete_route_is_excluded_but_complete_route_can_win(self, weather, routes):
        clear = Forecast(Weather(12, 0, 0), DEPARTURE)
        weather.return_value = [clear, Forecast(None, None, "Missing"), clear, clear]
        plan = plan_trip(ORIGIN, DESTINATION, DEPARTURE, 20000, 25)
        self.assertEqual(plan["recommended_route_id"], "route-2")
        self.assertIsNone(plan["routes"][0]["summary"])
        self.assertEqual(plan["routes"][0]["checkpoints"][-1]["risk"], "unavailable")

    @patch("apps.routing.services.planning.find_routes", return_value=[ROAD])
    @patch("apps.routing.services.planning.fetch_forecasts")
    def test_worse_endpoint_assigns_severe_miles_and_partial_final_interval(self, weather, routes):
        weather.return_value = [Forecast(Weather(wind, 0, 0), DEPARTURE) for wind in (0, 0, 38, 0)]
        plan = plan_trip(ORIGIN, DESTINATION, DEPARTURE, 42000, 10)
        self.assertAlmostEqual(plan["routes"][0]["summary"]["severe_miles"], 15)
        self.assertEqual(len(plan["routes"]), 1)
        self.assertIn("1 distinct", plan["warnings"][0])

    @patch("apps.routing.providers.routing.get_json")
    def test_duplicate_routes_are_not_presented_as_alternatives(self, request):
        route = {
            "geometry": {"coordinates": ROAD.coordinates},
            "legs": [{"annotation": {"distance": ROAD.distances, "duration": ROAD.durations}}],
        }
        request.return_value = {"code": "Ok", "routes": [route, route]}
        self.assertEqual(len(find_routes(ORIGIN, DESTINATION)), 1)

    @patch("apps.routing.providers.routing.get_json", return_value={"code": "NoRoute"})
    def test_disconnected_locations_are_reported(self, request):
        with self.assertRaises(ProviderError):
            find_routes(ORIGIN, DESTINATION)

    @patch("apps.routing.providers.routing.get_json")
    def test_malformed_provider_data_returns_a_controlled_error(self, request):
        for data in (None, [], {"code": "Ok", "routes": [{}]}):
            with self.subTest(data=data):
                request.return_value = data
                with self.assertRaises(ProviderError):
                    find_routes(ORIGIN, DESTINATION)


class PlanningApiTests(APISimpleTestCase):
    def setUp(self):
        cache.clear()
        self.payload = {
            "origin": ORIGIN,
            "destination": DESTINATION,
            "departure": (timezone.now() + timedelta(hours=1)).isoformat(),
            "load_weight_lb": 30000,
            "spacing_miles": 25,
        }

    @patch("apps.routing.views.plan_trip", return_value={"routes": []})
    def test_valid_plan_calls_service(self, plan):
        response = self.client.post("/api/trips/plan/", self.payload, format="json")
        self.assertEqual(response.status_code, 200)
        plan.assert_called_once()
        self.assertIsNotNone(plan.call_args.kwargs["departure"].tzinfo)

    def test_invalid_trip_fields_are_rejected(self):
        changes = [
            {"departure": "2026-10-13T10:00:00"},
            {"spacing_miles": 15},
            {"load_weight_lb": "NaN"},
            {"destination": ORIGIN},
            {"origin": {**ORIGIN, "latitude": 100}},
            {"departure": (timezone.now() + timedelta(days=8)).isoformat()},
            {"departure": (timezone.now() - timedelta(days=1)).isoformat()},
        ]
        for change in changes:
            cache.clear()
            with self.subTest(change=change):
                response = self.client.post(
                    "/api/trips/plan/", {**self.payload, **change}, format="json"
                )
                self.assertEqual(response.status_code, 400)

    @patch("apps.routing.views.plan_trip", side_effect=ProviderError("Routing unavailable"))
    def test_routing_outage_returns_actionable_error(self, plan):
        response = self.client.post("/api/trips/plan/", self.payload, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Routing unavailable")

    @patch("apps.routing.views.search_locations", return_value=[ORIGIN, DESTINATION])
    def test_location_search_returns_choices(self, search):
        response = self.client.get("/api/locations/?q=London")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["locations"]), 2)
        self.assertEqual(self.client.get("/api/locations/?q=x").status_code, 400)
