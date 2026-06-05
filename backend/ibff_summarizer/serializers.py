from rest_framework import serializers


class TopAreaSerializer(serializers.Serializer):
    province = serializers.CharField()
    affected_barangays = serializers.IntegerField(min_value=0)


class TopCitySerializer(serializers.Serializer):
    city = serializers.CharField()
    affected_barangays = serializers.IntegerField(min_value=0)


class ExposedFacilitiesSerializer(serializers.Serializer):
    schools = serializers.IntegerField(min_value=0, required=False)
    health_facilities = serializers.IntegerField(min_value=0, required=False)
    warehouses = serializers.IntegerField(min_value=0, required=False)


class ForecastSummaryInputSerializer(serializers.Serializer):
    forecast_timestamp = serializers.CharField()
    affected_barangays = serializers.IntegerField(min_value=0)
    affected_municipalities = serializers.IntegerField(min_value=0)
    affected_provinces = serializers.IntegerField(min_value=0)
    top_areas = TopAreaSerializer(many=True, required=False, default=list)
    top_cities = TopCitySerializer(many=True, required=False, default=list)
    exposed_facilities = ExposedFacilitiesSerializer(required=False, default=dict)
    highest_hazard_level = serializers.ChoiceField(
        choices=['Low', 'Medium', 'High', 'Very High', 'Extreme'],
        required=False,
        allow_blank=True,
        default='',
    )
    notes = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
