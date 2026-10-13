from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from .providers.geocoding import search_locations
from .providers.http import ProviderError
from .serializers import RiskRequestSerializer, TripRequestSerializer
from .services.planning import plan_trip
from .services.risk import Weather, assess_weather
from .throttles import LocationThrottle, PlanningThrottle


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["POST"])
def evaluate_risk(request):
    serializer = RiskRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    values = serializer.validated_data
    assessment = assess_weather(
        Weather(
            wind_mph=values["wind_mph"],
            rain_inches_per_hour=values["rain_inches_per_hour"],
            snow_inches_per_hour=values["snow_inches_per_hour"],
        ),
        load_weight_lb=values["load_weight_lb"],
    )
    return Response(
        {
            "level": assessment.level.name.lower(),
            "label": assessment.level.label,
            "score": int(assessment.level),
            "conditions": {
                "wind": assessment.wind.label,
                "rain": assessment.rain.label,
                "snow": assessment.snow.label,
            },
            "load_rule_applied": assessment.load_rule_applied,
        }
    )


@api_view(["GET"])
@throttle_classes([LocationThrottle])
def locations(request):
    query = request.query_params.get("q", "").strip()
    if not 2 <= len(query) <= 100:
        return Response({"detail": "Enter a city name between 2 and 100 characters."}, status=400)
    try:
        return Response({"locations": search_locations(query)})
    except ProviderError as error:
        return Response({"detail": str(error)}, status=503)


@api_view(["POST"])
@throttle_classes([PlanningThrottle])
def plan(request):
    serializer = TripRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        return Response(plan_trip(**serializer.validated_data))
    except ProviderError as error:
        return Response({"detail": str(error)}, status=503)
