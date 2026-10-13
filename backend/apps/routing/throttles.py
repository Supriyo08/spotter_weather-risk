from rest_framework.throttling import AnonRateThrottle


class LocationThrottle(AnonRateThrottle):
    rate = "30/min"
    scope = "locations"


class PlanningThrottle(AnonRateThrottle):
    rate = "6/min"
    scope = "planning"
