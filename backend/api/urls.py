from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

# creates endpoints at /api/{name}/
router.register(r'ingredients', IngredientsViewSet)        # /api/ingredients/
router.register(r'recipe-items', RecipeItemsViewSet)       # /api/recipe-items/
router.register(r'add-ons', AddOnsViewSet)                 # /api/add-ons/
router.register(r'menu-items', MenuItemsViewSet)           # /api/menu-items/
router.register(r'orders', OrdersViewSet)                  # /api/orders/
router.register(r'order-items', OrderItemsViewSet)         # /api/order-items/
router.register(r'employees', EmployeesViewSet)            # /api/employees/

urlpatterns = [
    path('', include(router.urls)),
]