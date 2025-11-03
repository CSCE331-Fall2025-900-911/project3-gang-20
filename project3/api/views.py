from django.shortcuts import render
from .models import *
# Create your views here.
def database_test_view(request):
    try:
        ingredients = Ingredients.objects.all()
        employees = Employees.objects.all()
        menu_items = MenuItems.objects.all()
        orders = Orders.objects.all()
    except Exception as e:
        return render(request, 'api/db_test.html', {'error': str(e)})
    context = { 
        'ingredients': ingredients,
        'employees': employees,
        'menu_items': menu_items,
        'orders': orders
        }
    
    return render(request, 'api/db_test.html', context)
