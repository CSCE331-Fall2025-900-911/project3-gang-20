from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets

# api endpoints (only for viewing right now)
class IngredientsViewSet(viewsets.ModelViewSet):
    queryset = Ingredients.objects.all().order_by('ingredient_id')
    serializer_class = IngredientsSerializer

# Recipe management - ingredients needed for each drink
class RecipeItemsViewSet(viewsets.ModelViewSet):
    queryset = RecipeItems.objects.all().order_by('menu_item')
    serializer_class = RecipeItemsSerializer

# Customization options (ice level, sweetness, toppings)
class AddOnsViewSet(viewsets.ModelViewSet):
    queryset = AddOns.objects.all()
    serializer_class = AddOnsSerializer

class MenuItemsViewSet(viewsets.ModelViewSet):
    queryset = MenuItems.objects.all().order_by('category', 'name')
    serializer_class = MenuItemsSerializer

# Customer order records
class OrdersViewSet(viewsets.ModelViewSet):
    queryset = Orders.objects.all()
    serializer_class = OrdersSerializer

# Individual items within each order
class OrderItemsViewSet(viewsets.ModelViewSet):
    queryset = OrderItems.objects.all()
    serializer_class = OrderItemsSerializer

class EmployeesViewSet(viewsets.ModelViewSet):
    queryset = Employees.objects.all().order_by('last_name')
    serializer_class = EmployeesSerializer