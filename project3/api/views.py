from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets

# This is an "API endpoint" for getting the list of ingredients
class IngredientsViewSet(viewsets.ModelViewSet):
    queryset = Ingredients.objects.all()
    serializer_class = IngredientsSerializer

# --- ADD THIS NEW VIEWSET ---
class MenuItemsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows menu items to be viewed.
    """
    queryset = MenuItems.objects.all().order_by('category', 'name') # Order them nicely
    serializer_class = MenuItemsSerializer


