from rest_framework import serializers
from .models import *

# This is your existing Ingredient serializer
class IngredientsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredients
        fields = '__all__'

# --- ADD THIS NEW SERIALIZER ---
class MenuItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItems
        fields = ['menu_item_id', 'name', 'category', 'price']

