from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'ingredients', IngredientsViewSet)
router.register(r'recipe-items', RecipeItemsViewSet)
router.register(r'add-ons', AddOnsViewSet)
router.register(r'menu-items', MenuItemsViewSet)
router.register(r'orders', OrdersViewSet)
router.register(r'order-items', OrderItemsViewSet)
router.register(r'employees', EmployeesViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]