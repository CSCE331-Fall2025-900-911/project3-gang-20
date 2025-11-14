from rest_framework import serializers
from .models import *

# This is your existing Ingredient serializer
class IngredientsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredients
        fields = '__all__'

class RecipeItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeItems
        fields = '__all__'

class AddOnsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOns
        fields = '__all__'

# --- ADD THIS NEW SERIALIZER ---
class MenuItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItems
        fields = '__all__'

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