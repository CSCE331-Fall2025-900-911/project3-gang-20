from rest_framework import serializers
from .models import *

# This is your existing Ingredient serializer
class IngredientsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredients
        fields = '__all__'

# Recipe ingredient requirements
class RecipeItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeItems
        fields = '__all__'

# Customization options (ice, sweetness, toppings)
class AddOnsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOns
        fields = '__all__'

# Menu item data
class MenuItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItems
        fields = '__all__'

# Order records
class OrdersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orders
        fields = '__all__'

class OrderItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItems
        fields = '__all__'

class EmployeesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employees
        fields ='__all__'