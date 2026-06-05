from django.urls import path
from .views import ForecastSummaryView
from .past_event_views import PastEventListView, PastEventSyncView, PastEventGenerateView

urlpatterns = [
    path('forecast-summary/', ForecastSummaryView.as_view(), name='forecast-summary'),
    path('past-events/', PastEventListView.as_view(), name='past-event-list'),
    path('past-events/sync/', PastEventSyncView.as_view(), name='past-event-sync'),
    path('past-events/<int:pk>/summary/', PastEventGenerateView.as_view(), name='past-event-summary'),
    path('past-events/<int:pk>/generate/', PastEventGenerateView.as_view(), name='past-event-generate'),
]
