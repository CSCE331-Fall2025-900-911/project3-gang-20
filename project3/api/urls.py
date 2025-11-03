from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'ingredients', IngredientsViewSet)
router.register(r'menu-items', MenuItemsViewSet) # <-- Add this new line

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]