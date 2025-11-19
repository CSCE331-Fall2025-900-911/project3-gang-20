# In your_app/serializers.py
from rest_framework import serializers
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
    customizations = serializers.StringRelatedField(many=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity', 'customizations']

class OrderSerializer(serializers.ModelSerializer):
    """
    The main Order serializer. It shows all its line items.
    """
    # 'items' is the related_name from the OrderItem model
    items = OrderItemSerializer(many=True, read_only=True)
    customer = serializers.StringRelatedField()
    employee = serializers.StringRelatedField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_date_time', 'payment_type', 
            'customer', 'employee', 'items'
        ]