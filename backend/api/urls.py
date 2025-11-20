"""
URL Configuration for the Boba Shop API.

This file maps API endpoints (URLs) to their corresponding ViewSets
using the Django REST Framework's DefaultRouter.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, EmployeeViewSet, IngredientViewSet,
    CustomizationCategoryViewSet, CustomizationOptionViewSet,
    MenuItemViewSet, OrdersViewSet, OrderItemViewSet, MenuCategoryViewSet, UnitViewSet, RecipeItemViewSet
)

# The DefaultRouter automatically generates URL patterns for our ViewSets,
# including list views, detail views, and associated actions.
router = DefaultRouter()

# --- Register ViewSets with the Router ---

# Core "People"
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'employees', EmployeeViewSet, basename='employee')

# Core "Menu & Inventory"
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'menu-categories', MenuCategoryViewSet, basename='menucategory')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')
router.register(r'recipe-items', RecipeItemViewSet, basename='recipeitem')

# Core "Customizations"
router.register(r'customization-categories', CustomizationCategoryViewSet, basename='customizationcategory')
router.register(r'customization-options', CustomizationOptionViewSet, basename='customizationoption')

# Core "Transactions"
router.register(r'orders', OrdersViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='orderitem')


# The API URLs are now determined automatically by the router.
# e.g., /api/orders/ and /api/orders/1/
urlpatterns = [
    path('', include(router.urls)),
]