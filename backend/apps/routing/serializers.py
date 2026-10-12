from math import isfinite

from rest_framework import serializers


class FiniteFloatField(serializers.FloatField):
    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if not isfinite(value):
            raise serializers.ValidationError("Enter a finite number.")
        return value


class RiskRequestSerializer(serializers.Serializer):
    wind_mph = FiniteFloatField(min_value=0, max_value=500)
    rain_inches_per_hour = FiniteFloatField(min_value=0, max_value=100)
    snow_inches_per_hour = FiniteFloatField(min_value=0, max_value=100)
    load_weight_lb = FiniteFloatField(min_value=0, max_value=1_000_000)
