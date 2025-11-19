# In your_app/views.py
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, Order, OrderItem, MenuCategory, Unit
)
from .serializers import (
    CustomerSerializer, EmployeeSerializer, UnitSerializer, IngredientSerializer,
    CustomizationCategorySerializer, CustomizationOptionSerializer,
    MenuCategorySerializer, MenuItemSerializer, OrderItemSerializer,
    OrderReadSerializer, OrderWriteSerializer 
)
from .filters import OrderFilter # Import our new filter


class OrdersViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for Orders that uses our new filter.
    """
    queryset = Order.objects.all().order_by('-order_date_time')
    # serializer_class = OrderSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_class = OrderFilter
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderWriteSerializer
        return OrderReadSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

class CustomizationCategoryViewSet(viewsets.ModelViewSet):
    queryset = CustomizationCategory.objects.all()
    serializer_class = CustomizationCategorySerializer

class CustomizationOptionViewSet(viewsets.ModelViewSet):
    queryset = CustomizationOption.objects.all()
    serializer_class = CustomizationOptionSerializer

class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer