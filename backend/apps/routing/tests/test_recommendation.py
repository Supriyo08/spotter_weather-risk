from unittest import TestCase

from apps.routing.services.recommendation import RouteSegment, recommend_route, summarize_route
from apps.routing.services.risk import RiskLevel


def route(route_id, segments, minutes=60):
    return summarize_route(
        route_id, minutes, [RouteSegment(miles, risk) for miles, risk in segments]
    )


class RecommendationTests(TestCase):
    def test_distance_weights_average_risk(self):
        summary = route("a", [(10, RiskLevel.HIGH), (90, RiskLevel.LOW)])
        self.assertEqual(summary.average_risk, 0.2)
        self.assertEqual(summary.high_miles, 10)
        self.assertEqual(summary.distance_miles, 100)

    def test_severe_miles_take_priority_over_high_miles(self):
        safer = route("safer", [(100, RiskLevel.HIGH)], 120)
        other = route("other", [(1, RiskLevel.SEVERE), (99, RiskLevel.LOW)])
        self.assertEqual(recommend_route([other, safer]), safer)

    def test_high_miles_take_priority_over_average_and_time(self):
        safer = route("safer", [(100, RiskLevel.MODERATE)], 120)
        other = route("other", [(1, RiskLevel.HIGH), (99, RiskLevel.LOW)])
        self.assertEqual(recommend_route([other, safer]), safer)

    def test_average_risk_takes_priority_over_time(self):
        safer = route("safer", [(100, RiskLevel.LOW)], 120)
        faster = route("faster", [(100, RiskLevel.MODERATE)])
        self.assertEqual(recommend_route([faster, safer]), safer)

    def test_time_breaks_risk_tie(self):
        slow = route("slow", [(100, RiskLevel.LOW)], 120)
        fast = route("fast", [(100, RiskLevel.LOW)])
        self.assertEqual(recommend_route([slow, fast]), fast)

    def test_no_travel_route_is_never_recommended(self):
        blocked = route("blocked", [(1, RiskLevel.NO_TRAVEL), (99, RiskLevel.LOW)])
        eligible = route("eligible", [(100, RiskLevel.SEVERE)])
        self.assertEqual(recommend_route([blocked, eligible]), eligible)
        self.assertIsNone(recommend_route([blocked]))
        self.assertIsNone(recommend_route([]))

    def test_invalid_route_distances_and_durations(self):
        for segments in (
            [],
            [(0, RiskLevel.LOW)],
            [(-1, RiskLevel.LOW)],
            [(float("nan"), RiskLevel.LOW)],
        ):
            with self.subTest(segments=segments), self.assertRaises(ValueError):
                route("invalid", segments)
        with self.assertRaises(ValueError):
            route("invalid", [(1, RiskLevel.LOW)], minutes=-1)
