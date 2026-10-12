from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import RiskRequestSerializer
from .services.risk import Weather, assess_weather


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
