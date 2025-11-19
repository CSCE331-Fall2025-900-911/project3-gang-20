# In your_app/filters.py
import django_filters
from .models import Order

class OrderFilter(django_filters.FilterSet):
    """
    A filter for the new Order model.
    """
    
    # This creates 'order_date_after' and 'order_date_before'
    # It works by filtering on the 'date' part of the 'order_date_time' field.
    order_date = django_filters.DateFromToRangeFilter(
        field_name='order_date_time__date'
    )
    
    # We can also filter by payment type or employee
    payment_type = django_filters.CharFilter(lookup_expr='iexact')
    employee = django_filters.NumberFilter() # Filter by employee ID

    class Meta:
        model = Order
        fields = ['order_date', 'payment_type', 'employee']