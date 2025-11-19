from rest_framework import serializers
from django.db import transaction
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)

# --- Simple Serializers ---

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'

class IngredientSerializer(serializers.ModelSerializer):
    unit = serializers.StringRelatedField()
    class Meta:
        model = Ingredient
        fields = '__all__'

class CustomizationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizationCategory
        fields = '__all__'

class CustomizationOptionSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField() 
    class Meta:
        model = CustomizationOption
        fields = '__all__'

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = '__all__'

# --- Complex Serializers with Nesting ---

class RecipeItemSerializer(serializers.ModelSerializer):
    """
    A nested serializer to show ingredients *inside* a MenuItem.
    """
    ingredient = serializers.StringRelatedField()
    unit = serializers.StringRelatedField(source='ingredient.unit') # Show the unit

    class Meta:
        model = RecipeItem
        fields = ['ingredient', 'quantity', 'unit']

class MenuItemSerializer(serializers.ModelSerializer):
    """
    The serializer for a MenuItem, which shows its recipe
    and available customization categories.
    """
    # Use 'recipeitem_set' (default reverse name) to get recipe
    recipe = RecipeItemSerializer(source='recipeitem_set', many=True, read_only=True)
    
    # Show categories like "Toppings", "Ice Level"
    available_customizations = serializers.StringRelatedField(many=True, read_only=True)
    category = serializers.StringRelatedField()
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'category', 'base_price', 
            'recipe', 'available_customizations'
        ]

# --- Order Serializers (Read vs. Write) ---

class OrderItemSerializer(serializers.ModelSerializer):
    """
    A nested serializer to READ line items *inside* an Order.
    """
    menu_item = serializers.StringRelatedField()
    customizations = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity', 'customizations']

class OrderItemWriteSerializer(serializers.ModelSerializer):
    """
    A nested serializer to WRITE line items *inside* an Order.
    """
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    customizations = serializers.PrimaryKeyRelatedField(
        queryset=CustomizationOption.objects.all(),
        many=True,
        required=False  # Allow items with no customizations
    )

    class Meta:
        model = OrderItem
        fields = ['menu_item', 'quantity', 'customizations']

class OrderReadSerializer(serializers.ModelSerializer):
    """
    Used for GET requests. Shows full, readable, nested data.
    """
    
    # THIS IS THE FIX:
    # We removed source='items' because the field name 'items'
    # automatically matches the 'related_name' from your model.
    items = OrderItemSerializer(many=True, read_only=True)
    
    customer = serializers.StringRelatedField()
    employee = serializers.StringRelatedField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_date_time', 'payment_type', 
            'customer', 'employee', 'items'
        ]

class OrderWriteSerializer(serializers.ModelSerializer):
    """
    Used for POST requests. Accepts IDs for relations and nested items.
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
    
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'order_date_time', 'payment_type', 
            'customer', 'employee', 'items'
        ]

    @transaction.atomic
    def create(self, validated_data):
        """
        Custom create method to handle the nested OrderItems.
        """
        items_data = validated_data.pop('items')
        
        # Create the main Order object
        order = Order.objects.create(**validated_data)
        
        # Loop through the items data and create each OrderItem
        for item_data in items_data:
            customizations_data = item_data.pop('customizations', [])
            order_item = OrderItem.objects.create(order=order, **item_data)
            order_item.customizations.set(customizations_data)
                
        return order