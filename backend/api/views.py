from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)
from .serializers import (
    CustomerSerializer, EmployeeSerializer, IngredientSerializer,
    CustomizationCategorySerializer, CustomizationOptionSerializer,
    MenuItemSerializer, RecipeItemSerializer, OrderReadSerializer,
    OrderWriteSerializer, MenuCategorySerializer, UnitSerializer,
    OrderItemSerializer
)

# --- Standard ViewSets ---

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

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
    """
    Serves menu items, pre-fetching their recipe and customization data
    for better performance.
    """
    queryset = MenuItem.objects.all().prefetch_related(
        'recipeitem_set__ingredient__unit', 
        'available_customizations', 
        'category'
    )
    serializer_class = MenuItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category'] # Allow filtering by /api/menu-items/?category=1

class RecipeItemViewSet(viewsets.ModelViewSet):
    queryset = RecipeItem.objects.all()
    serializer_class = RecipeItemSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer # Uses the simple read serializer

# --- Special ViewSet for Orders ---

class OrdersViewSet(viewsets.ModelViewSet):
    """
    Handles both reading (GET) and writing (POST) orders
    by using different serializers for each action.
    """
    
    # THIS IS THE FIX:
    # We prefetch all related data based on your model's 'related_name'
    queryset = Order.objects.all().order_by('-order_date_time').prefetch_related(
        'items__menu_item',  # 'items' is your related_name
        'items__customizations',
        'customer',
        'employee'
    )
    
    # THIS IS THE OTHER FIX:
    def get_serializer_class(self):
        """
        Chooses the serializer based on the request action.
        """
        if self.action == 'create':
            # Use OrderWriteSerializer for POST requests
            return OrderWriteSerializer
        
        # Use OrderReadSerializer for GET, PUT, PATCH, etc.
        return OrderReadSerializer