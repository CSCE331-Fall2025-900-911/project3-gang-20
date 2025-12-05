from rest_framework import serializers
from django.db import transaction
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)

# --- Simple Serializers ---
# These models do not have complex relationships and can use a single
# serializer for both reading and writing.

class CustomerReadSerializer(serializers.ModelSerializer):
    """Serializes Customer data."""
    class Meta:
        model = Customer
        # Explicitly list fields to control the API output
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'joined_date', 'points']

class EmployeeReadSerializer(serializers.ModelSerializer):
    """Serializes Employee data, hiding the legacy ID."""
    class Meta:
        model = Employee
        # Explicitly list fields to hide 'legacy_employee_id'
        fields = ['id', 'first_name', 'last_name', 'position', 'hire_date']

class UnitReadSerializer(serializers.ModelSerializer):
    """Serializes Unit data (e.g., "oz", "scoop")."""
    class Meta:
        model = Unit
        fields = ['id', 'name', 'abbreviation']

class MenuCategoryReadSerializer(serializers.ModelSerializer):
    """Serializes MenuCategory data."""
    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'description']

class CustomizationCategoryReadSerializer(serializers.ModelSerializer):
    """Serializes CustomizationCategory data."""
    class Meta:
        model = CustomizationCategory
        fields = ['id', 'name']


# --- "Read" Serializers (For GET requests) ---
# These show human-readable strings (StringRelatedField) for related fields.

class IngredientReadSerializer(serializers.ModelSerializer):
    """Serializes Ingredient data for reading, showing the unit abbreviation."""
    # Show the unit's abbreviation (e.g., "oz") instead of its ID
    unit = serializers.StringRelatedField()
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'stock_level', 'unit', 'low_stock_threshold']

class CustomizationOptionReadSerializer(serializers.ModelSerializer):
    """Serializes CustomizationOption data for reading."""
    # Show the string names for category and ingredient
    category = serializers.StringRelatedField() 
    ingredient = serializers.StringRelatedField()
    # unit = serializers.StringRelatedField() # <-- REMOVED
    class Meta:
        model = CustomizationOption
        fields = ['id', 'name', 'category', 'ingredient', 'price', 'quantity']

class RecipeItemReadSerializer(serializers.ModelSerializer):
    """Serializes a MenuItem's recipe for reading."""
    ingredient = serializers.StringRelatedField()
    # Pull the unit name from the related ingredient
    unit = serializers.StringRelatedField(source='ingredient.unit')

    class Meta:
        model = RecipeItem
        fields = ['id', 'menu_item', 'ingredient', 'quantity', 'unit']

class MenuItemReadSerializer(serializers.ModelSerializer):
    """Serializes a full MenuItem for reading, nesting its recipe."""
    # ... (other fields)
    category = serializers.StringRelatedField()
    
    # The ImageField will automatically serialize to its full URL
    recipe = RecipeItemReadSerializer(source='recipeitem_set', many=True, read_only=True)
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'category', 'base_price', 
            'image',
            'recipe'
            # , 'available_customizations'
        ]

class OrderItemReadSerializer(serializers.ModelSerializer):
    """Serializes an OrderItem for reading (nested inside an Order)."""
    menu_item = serializers.StringRelatedField()
    customizations = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity', 'customizations']

class OrderReadSerializer(serializers.ModelSerializer):
    """Serializes a full Order for reading, nesting its items."""
    # Nest all related order items
    items = OrderItemReadSerializer(many=True, read_only=True)
    # customer = serializers.StringRelatedField()
    employee = serializers.StringRelatedField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_date_time', 'sub_total', 'payment_type', 
            'customer', 'employee', 'items'
        ]


# --- "Write" Serializers (For POST/PUT requests) ---
# These accept simple IDs (PrimaryKeyRelatedField) for related fields.

class CustomerWriteSerializer(serializers.ModelSerializer):
    """Serializes Customer data for writing."""
    class Meta:
        model = Customer
        # 'id' is not included, it comes from the URL
        fields = ['first_name', 'last_name', 'email', 'phone', 'joined_date', 'points']

class EmployeeWriteSerializer(serializers.ModelSerializer):
    """Serializes Employee data for writing."""
    class Meta:
        model = Employee
        # 'id' is not included, it comes from the URL
        fields = ['first_name', 'last_name', 'position', 'hire_date']

class UnitWriteSerializer(serializers.ModelSerializer):
    """Serializes Unit data for writing."""
    class Meta:
        model = Unit
        fields = ['name', 'abbreviation']

class MenuCategoryWriteSerializer(serializers.ModelSerializer):
    """Serializes MenuCategory data for writing."""
    class Meta:
        model = MenuCategory
        fields = ['name', 'description']

class CustomizationCategoryWriteSerializer(serializers.ModelSerializer):
    """Serializes CustomizationCategory data for writing."""
    class Meta:
        model = CustomizationCategory
        fields = ['name']


class IngredientWriteSerializer(serializers.ModelSerializer):
    """Serializes an Ingredient for writing, accepting a Unit ID."""
    # Accept a simple integer ID for the unit
    unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), allow_null=True)
    
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'stock_level', 'unit', 'low_stock_threshold']

class CustomizationOptionWriteSerializer(serializers.ModelSerializer):
    """Serializes a CustomizationOption for writing."""
    # Accept integer IDs for category and ingredient
    category = serializers.PrimaryKeyRelatedField(queryset=CustomizationCategory.objects.all())
    ingredient = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all(), allow_null=True, required=False)
    # unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), allow_null=True, required=False)

    class Meta:
        model = CustomizationOption
        fields = ['id', 'name', 'category', 'ingredient', 'price', 'quantity']

class RecipeItemWriteSerializer(serializers.ModelSerializer):
    """Serializes a RecipeItem for writing."""
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    ingredient = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all())

    class Meta:
        model = RecipeItem
        fields = ['id', 'menu_item', 'ingredient', 'quantity']

class MenuItemWriteSerializer(serializers.ModelSerializer):
    """Serializes a MenuItem for writing."""
    category = serializers.PrimaryKeyRelatedField(queryset=MenuCategory.objects.all(), allow_null=True, required=False)
    
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'category', 'base_price', 'image']

class OrderItemWriteSerializer(serializers.ModelSerializer):
    """Serialserializes an OrderItem for writing (nested inside an Order)."""
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    # Accept a list of customization option IDs
    customizations = serializers.PrimaryKeyRelatedField(
        queryset=CustomizationOption.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity', 'customizations']

class OrderWriteSerializer(serializers.ModelSerializer):
    """
    Serializes an Order for writing (POST), handling nested creation of
    OrderItems.
    """
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), 
        allow_null=True, 
        required=False
    )
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        allow_null=True, 
        required=False
    )
    # Accept a nested list of item objects
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_date_time', 'payment_type', 
            'customer', 'employee', 'items'
        ]

    @transaction.atomic
    def create(self, validated_data):
        """
        Custom create method to handle the nested OrderItems.
        This ensures that either the order and all its items are created,
        or none of them are (if an error occurs).
        """
        # Pop the nested 'items' data off the main dictionary
        items_data = validated_data.pop('items')
        
        # Create the main Order object
        order = Order.objects.create(**validated_data)
        
        # Loop through the items data and create each OrderItem
        for item_data in items_data:
            customizations_data = item_data.pop('customizations', [])
            order_item = OrderItem.objects.create(order=order, **item_data)
            # Set the many-to-many customizations for the item
            order_item.customizations.set(customizations_data)
                
        return order