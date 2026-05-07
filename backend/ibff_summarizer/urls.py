from django.urls import path
from .views import ForecastSummaryView

urlpatterns = [
    path('forecast-summary/', ForecastSummaryView.as_view(), name='forecast-summary'),
]
