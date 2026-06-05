from django.db import models
from django.utils import timezone


class SummaryAuditLog(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    forecast_timestamp = models.CharField(max_length=100, blank=True)
    model_run = models.CharField(max_length=20, blank=True)

    input_json = models.JSONField()
    output_json = models.JSONField()

    ollama_model = models.CharField(max_length=100, blank=True)
    source = models.CharField(
        max_length=20,
        choices=[('llm', 'LLM'), ('fallback', 'Fallback')],
        default='fallback',
    )
    validation_passed = models.BooleanField(default=True)
    validation_failure_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.forecast_timestamp} [{self.source}] @ {self.created_at:%Y-%m-%d %H:%M}'


class PastEvent(models.Model):
    """One record per typhoon (e.g. TINO), spanning all its date tabs."""
    event_name = models.CharField(max_length=100, unique=True)  # e.g. "BASYANG"
    date_start = models.DateField()
    date_end = models.DateField(null=True, blank=True)
    sheet_gids = models.JSONField(default=list)  # GIDs of all synced tabs for this event
    total_municipalities = models.IntegerField(default=0)   # unique munis across all dates
    confirmed_municipalities = models.IntegerField(default=0)  # unique confirmed munis
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_start']

    def __str__(self):
        return f'{self.event_name} ({self.date_start} – {self.date_end or "?"})'

    @property
    def display_name(self) -> str:
        return f'Typhoon {self.event_name.title()}'

    def is_stale(self, cache_minutes: int = 60) -> bool:
        if self.last_synced_at is None:
            return True
        return (timezone.now() - self.last_synced_at).total_seconds() > cache_minutes * 60


class PastEventMunicipality(models.Model):
    event = models.ForeignKey(PastEvent, on_delete=models.CASCADE, related_name='municipalities')
    province = models.CharField(max_length=200)
    municipality = models.CharField(max_length=200)
    has_flooding_report = models.BooleanField(default=False)
    reference_url = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    tab_date = models.DateField(null=True, blank=True)  # which sheet tab this row came from

    class Meta:
        ordering = ['province', 'municipality']

    def __str__(self):
        status = 'confirmed' if self.has_flooding_report else 'no report'
        return f'{self.municipality}, {self.province} [{status}]'


class PastEventSummary(models.Model):
    event = models.OneToOneField(PastEvent, on_delete=models.CASCADE, related_name='summary')
    summary_output = models.JSONField()
    source = models.CharField(
        max_length=20,
        choices=[('llm', 'LLM'), ('fallback', 'Fallback')],
        default='fallback',
    )
    validation_passed = models.BooleanField(default=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Summary for {self.event.event_name} [{self.source}]'
