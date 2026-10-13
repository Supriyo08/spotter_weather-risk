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


class LocationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=180)
    latitude = FiniteFloatField(min_value=-90, max_value=90)
    longitude = FiniteFloatField(min_value=-180, max_value=180)


class DepartureField(serializers.DateTimeField):
    def to_internal_value(self, value):
        from django.utils.dateparse import parse_datetime
        from django.utils.timezone import is_aware

        try:
            parsed = parse_datetime(value)
        except (ValueError, TypeError):
            parsed = None
        if parsed is None or not is_aware(parsed):
            raise serializers.ValidationError("Include a timezone offset in the departure time.")
        return super().to_internal_value(value)


class TripRequestSerializer(serializers.Serializer):
    origin = LocationSerializer()
    destination = LocationSerializer()
    departure = DepartureField()
    load_weight_lb = FiniteFloatField(min_value=0, max_value=1_000_000)
    spacing_miles = serializers.ChoiceField(choices=(10, 25, 50))

    def validate_departure(self, value):
        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()
        if value < now - timedelta(minutes=5) or value > now + timedelta(days=6):
            raise serializers.ValidationError(
                "Choose a departure from now through the next six days."
            )
        return value

    def validate(self, values):
        origin, destination = values["origin"], values["destination"]
        if (origin["latitude"], origin["longitude"]) == (
            destination["latitude"],
            destination["longitude"],
        ):
            raise serializers.ValidationError("Choose different origin and destination locations.")
        return values
