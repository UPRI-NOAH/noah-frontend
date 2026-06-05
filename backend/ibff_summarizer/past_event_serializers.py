from rest_framework import serializers
from .models import PastEvent, PastEventSummary


class PastEventListSerializer(serializers.ModelSerializer):
    has_summary = serializers.SerializerMethodField()
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = PastEvent
        fields = [
            'id', 'event_name', 'display_name',
            'date_start', 'date_end',
            'total_municipalities', 'confirmed_municipalities',
            'has_summary', 'last_synced_at',
        ]

    def get_has_summary(self, obj) -> bool:
        return hasattr(obj, 'summary')


class PastEventSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = PastEventSummary
        fields = ['source', 'validation_passed', 'generated_at', 'summary_output']
