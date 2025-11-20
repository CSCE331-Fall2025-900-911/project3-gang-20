from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)
from .serializers import (
    # Read Serializers
    CustomerReadSerializer, EmployeeReadSerializer, 
    MenuCategoryReadSerializer, UnitReadSerializer, CustomizationCategoryReadSerializer,
    IngredientReadSerializer, CustomizationOptionReadSerializer,
    MenuItemReadSerializer, RecipeItemReadSerializer, 
    OrderReadSerializer, OrderItemReadSerializer,

    # Write Serializers
    CustomerWriteSerializer, EmployeeWriteSerializer,
    MenuCategoryWriteSerializer, UnitWriteSerializer, CustomizationCategoryWriteSerializer,
    IngredientWriteSerializer, CustomizationOptionWriteSerializer,
    MenuItemWriteSerializer, RecipeItemWriteSerializer,
    OrderWriteSerializer, OrderItemWriteSerializer
)

# --- Standard ViewSets ---
# These ViewSets use a single serializer for all actions.

class CustomerViewSet(viewsets.ModelViewSet):
    """API endpoint for Customers."""
    queryset = Customer.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return CustomerWriteSerializer
        return CustomerReadSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    """API endpoint for Employees."""
    queryset = Employee.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return EmployeeWriteSerializer
        return EmployeeReadSerializer

class UnitViewSet(viewsets.ModelViewSet):
    """API endpoint for Units of measurement."""
    queryset = Unit.objects.all()

    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return UnitWriteSerializer
        return UnitReadSerializer

class CustomizationCategoryViewSet(viewsets.ModelViewSet):
    """API endpoint for Customization Categories."""
    queryset = CustomizationCategory.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return CustomizationCategoryWriteSerializer
        return CustomizationCategoryReadSerializer

class MenuCategoryViewSet(viewsets.ModelViewSet):
    """API endpoint for Menu Categories."""
    queryset = MenuCategory.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return MenuCategoryWriteSerializer
        return MenuCategoryReadSerializer


# --- ViewSets with Read/Write Logic ---
# These ViewSets use get_serializer_class() to choose the correct
# serializer based on the request action (e.g., GET vs. POST).

class IngredientViewSet(viewsets.ModelViewSet):
    """API endpoint for Ingredients."""
    queryset = Ingredient.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return IngredientWriteSerializer
        return IngredientReadSerializer

class CustomizationOptionViewSet(viewsets.ModelViewSet):
    """API endpoint for Customization Options."""
    queryset = CustomizationOption.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return CustomizationOptionWriteSerializer
        return CustomizationOptionReadSerializer

class MenuItemViewSet(viewsets.ModelViewSet):
    """API endpoint for Menu Items."""
    # Use prefetch_related to optimize queries by fetching all
    # related data (recipes, units, etc.) in a single batch.
    queryset = MenuItem.objects.all().prefetch_related(
        'recipeitem_set__ingredient__unit', 
        # 'available_customizations', 
        'category'
    )
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category'] # Allows filtering by /api/menu-items/?category=1
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return MenuItemWriteSerializer
        return MenuItemReadSerializer

class RecipeItemViewSet(viewsets.ModelViewSet):
    """API endpoint for Recipe Items."""
    queryset = RecipeItem.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeItemWriteSerializer
        return RecipeItemReadSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    """API endpoint for individual Order Items."""
    queryset = OrderItem.objects.all()
    
    def get_serializer_class(self):
        """Use WriteSerializer for create/update, ReadSerializer otherwise."""
        if self.action in ['create', 'update', 'partial_update']:
            return OrderItemWriteSerializer
        return OrderItemReadSerializer

class OrdersViewSet(viewsets.ModelViewSet):
    """API endpoint for Orders."""
    # Prefetch related data for efficiency
    queryset = Order.objects.all().order_by('-order_date_time').prefetch_related(
        'items__menu_item',
        'items__customizations',
        'customer',
        'employee'
    )
    
    def get_serializer_class(self):
        """
        Chooses the serializer based on the request action.
        - 'create': Use OrderWriteSerializer to handle nested items.
        - 'update'/'partial_update': Use OrderWriteSerializer.
        - 'list'/'retrieve' (GET): Use OrderReadSerializer for nested display.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return OrderWriteSerializer
        return OrderReadSerializer