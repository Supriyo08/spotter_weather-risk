from django.urls import path

from . import views

urlpatterns = [
    path("locations/", views.locations, name="locations"),
    path("trips/plan/", views.plan, name="plan-trip"),
    path("health/", views.health, name="health"),
    path("risk/evaluate/", views.evaluate_risk, name="evaluate-risk"),
]
