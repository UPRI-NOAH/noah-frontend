from django.urls import path, include

urlpatterns = [
    path('api/', include('ibff_summarizer.urls')),
]
