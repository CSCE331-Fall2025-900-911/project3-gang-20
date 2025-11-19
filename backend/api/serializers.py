# In your_app/serializers.py
from rest_framework import serializers
from django.db import transaction
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)

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
        fields = ['id', 'name', 'abbreviation']

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
    # Show the category name instead of just its ID
    category = serializers.StringRelatedField() 
    
    class Meta:
        model = CustomizationOption
        fields = ['id', 'name', 'price', 'category', 'ingredient']

# --- Complex Serializers with Nesting ---

class RecipeItemSerializer(serializers.ModelSerializer):
    """
    A nested serializer to show ingredients *inside* a MenuItem.
    """
    # Show the ingredient's name instead of its ID
    ingredient = serializers.StringRelatedField()

    class Meta:
        model = RecipeItem
        fields = ['ingredient', 'quantity']

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'description']

class MenuItemSerializer(serializers.ModelSerializer):
    """
    The serializer for a MenuItem, which shows its recipe.
    """
    recipe = RecipeItemSerializer(source='recipeitem_set', many=True, read_only=True)
    available_customizations = serializers.StringRelatedField(many=True, read_only=True)
    category = serializers.StringRelatedField()
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'category', 'base_price', 
            'recipe', 'available_customizations'
        ]

class OrderItemSerializer(serializers.ModelSerializer):
    """
    A nested serializer to show line items *inside* an Order.
    """
    menu_item = serializers.StringRelatedField()
    customizations = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity', 'customizations']

class OrderItemWriteSerializer(serializers.ModelSerializer):
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
    # This field is for reading the items, it's perfect
    items = OrderItemSerializer(source='orderitem_set', many=True, read_only=True)
    
    # These StringRelatedFields are great for reading
    customer = serializers.StringRelatedField()
    employee = serializers.StringRelatedField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_date_time', 'payment_type', 
            'customer', 'employee', 'items'
        ]
        
class OrderWriteSerializer(serializers.ModelSerializer):
    # Accept IDs for the foreign keys
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), 
        allow_null=True, 
        required=False
    )
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all()
    )
    
    # Use our new 'OrderItemWriteSerializer' for the nested items
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'order_date_time', 'payment_type', 
            'customer', 'employee', 'items'
        ]

    # This is the magic!
    @transaction.atomic  # Ensures all or nothing is saved
    def create(self, validated_data):
        # 1. Pop the nested 'items' data off
        items_data = validated_data.pop('items')
        
        # 2. Create the main Order object
        order = Order.objects.create(**validated_data)
        
        # 3. Loop through the items data
        for item_data in items_data:
            # 4. Pop the nested 'customizations' data off
            customizations_data = item_data.pop('customizations', [])
            
            # 5. Create the OrderItem, linking it to the Order
            order_item = OrderItem.objects.create(order=order, **item_data)
            
            # 6. Set the ManyToMany customizations
            order_item.customizations.set(customizations_data)
                
        return order