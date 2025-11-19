from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, EmployeeViewSet, IngredientViewSet,
    CustomizationCategoryViewSet, CustomizationOptionViewSet,
    MenuItemViewSet, OrdersViewSet, OrderItemViewSet, MenuCategoryViewSet, UnitViewSet
)

router = DefaultRouter()

# Core "People"
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'employees', EmployeeViewSet, basename='employee')

# Core "Menu & Inventory"
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'menu-categories', MenuCategoryViewSet, basename='menucategory')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')

# Core "Customizations" (Replaces the old 'AddOns')
router.register(r'customization-categories', CustomizationCategoryViewSet, basename='customizationcategory')
router.register(r'customization-options', CustomizationOptionViewSet, basename='customizationoption')

# Core "Transactions"
router.register(r'orders', OrdersViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='orderitem')


urlpatterns = [
    path('', include(router.urls)),
]