from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Sum, Count, F, FloatField, Q, ExpressionWrapper, DecimalField, Max
from django.db.models.functions import TruncHour, Cast

from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)
from .serializers import (
    # Read Serializers
    CustomerReadSerializer, EmployeeReadSerializer, 
    MenuCategoryReadSerializer, UnitReadSerializer, CustomizationCategoryReadSerializer,
    IngredientReadSerializer, CustomizationOptionReadSerializer,
    MenuItemReadSerializer, RecipeItemReadSerializer, 
    OrderReadSerializer, OrderItemReadSerializer,

    # Write Serializers
    CustomerWriteSerializer, EmployeeWriteSerializer,
    MenuCategoryWriteSerializer, UnitWriteSerializer, CustomizationCategoryWriteSerializer,
    IngredientWriteSerializer, CustomizationOptionWriteSerializer,
    MenuItemWriteSerializer, RecipeItemWriteSerializer,
    OrderWriteSerializer, OrderItemWriteSerializer
)

# --- Standard ViewSets ---

class CustomerViewSet(viewsets.ModelViewSet):
    """API endpoint for Customers."""
    queryset = Customer.objects.all()
    filter_backends = [DjangoFilterBackend] 
    filterset_fields = ['email']
    def get_serializer_class(self):
        return CustomerWriteSerializer if self.action in ['create', 'update', 'partial_update'] else CustomerReadSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    def get_serializer_class(self):
        return EmployeeWriteSerializer if self.action in ['create', 'update', 'partial_update'] else EmployeeReadSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    def get_serializer_class(self):
        return UnitWriteSerializer if self.action in ['create', 'update', 'partial_update'] else UnitReadSerializer

class CustomizationCategoryViewSet(viewsets.ModelViewSet):
    queryset = CustomizationCategory.objects.all()
    def get_serializer_class(self):
        return CustomizationCategoryWriteSerializer if self.action in ['create', 'update', 'partial_update'] else CustomizationCategoryReadSerializer

class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all()
    def get_serializer_class(self):
        return MenuCategoryWriteSerializer if self.action in ['create', 'update', 'partial_update'] else MenuCategoryReadSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().select_related('unit')
    def get_serializer_class(self):
        return IngredientWriteSerializer if self.action in ['create', 'update', 'partial_update'] else IngredientReadSerializer

class CustomizationOptionViewSet(viewsets.ModelViewSet):
    queryset = CustomizationOption.objects.all().select_related('category', 'ingredient')
    def get_serializer_class(self):
        return CustomizationOptionWriteSerializer if self.action in ['create', 'update', 'partial_update'] else CustomizationOptionReadSerializer

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all().select_related('category').prefetch_related('recipeitem_set__ingredient__unit')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category'] 
    def get_serializer_class(self):
        return MenuItemWriteSerializer if self.action in ['create', 'update', 'partial_update'] else MenuItemReadSerializer

class RecipeItemViewSet(viewsets.ModelViewSet):
    queryset = RecipeItem.objects.all().select_related('menu_item', 'ingredient__unit')
    def get_serializer_class(self):
        return RecipeItemWriteSerializer if self.action in ['create', 'update', 'partial_update'] else RecipeItemReadSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all().select_related('menu_item').prefetch_related('customizations')
    def get_serializer_class(self):
        return OrderItemWriteSerializer if self.action in ['create', 'update', 'partial_update'] else OrderItemReadSerializer

# --- CORE UPDATE: Optimized Orders ViewSet with Server-Side Reporting ---

class OrdersViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Orders.
    Includes custom actions for generating reports (X-Report, Z-Report, etc.)
    directly via database aggregation to improve performance.
    """
    queryset = Order.objects.all().order_by('-order_date_time').select_related(
        'customer',
        'employee'
    ).prefetch_related(
        'items__menu_item',
        'items__customizations'
    )
    
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter] 
    filterset_fields = ['customer']          
    ordering_fields = ['order_date_time']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderWriteSerializer
        return OrderReadSerializer

    # --- REPORT ACTIONS (Server-Side Aggregation) ---

    @action(detail=False, methods=['get'])
    def latest_id(self, request):
        """
        Efficiently retrieve the ID of the most recent order.
        Used by the frontend to determine the next order number without fetching all records.
        """
        # Aggregate the maximum ID from the Order table
        max_id = Order.objects.aggregate(Max('id'))['id__max']
        # If no orders exist, max_id will be None, so return 0
        return Response({'latest_id': max_id or 0})

    @action(detail=False, methods=['get'])
    def x_report(self, request):
        """Aggregate hourly sales for a specific date (Server-Side)."""
        date = request.query_params.get('date')
        if not date:
            return Response({"error": "Date parameter is required (YYYY-MM-DD)"}, status=400)

        # Truncate to hour and group
        hourly_data = (
            Order.objects.filter(order_date_time__date=date)
            .exclude(payment_type='VOID')
            .annotate(hour=TruncHour('order_date_time'))
            .values('hour')
            .annotate(
                orders=Count('id'),
                gross=Sum('sub_total'), 
            )
            .order_by('hour')
        )
        
        formatted_rows = []
        total_orders = 0
        total_gross = 0.0
        
        for entry in hourly_data:
            h = entry['hour'].hour 
            gross = float(entry['gross'] or 0)
            formatted_rows.append({
                "hour": h,
                "orders": entry['orders'],
                "gross": gross,
            })
            total_orders += entry['orders']
            total_gross += gross

        return Response({
            "rows": formatted_rows,
            "totals": { "orders": total_orders, "gross": total_gross }
        })

    @action(detail=False, methods=['get'])
    def z_report(self, request):
        """Aggregate daily totals (Server-Side)."""
        date = request.query_params.get('date')
        if not date:
            return Response({"error": "Date parameter is required (YYYY-MM-DD)"}, status=400)

        orders = Order.objects.filter(order_date_time__date=date)
        
        stats = orders.aggregate(
            total_sales=Sum('sub_total', filter=~Q(payment_type='VOID')),
            cash_sales=Count('id', filter=Q(payment_type='Cash')),
            card_sales=Count('id', filter=Q(payment_type='Card')),
            void_count=Count('id', filter=Q(payment_type='VOID')),
        )
        
        gross = float(stats['total_sales'] or 0)
        TAX_RATE_MULTIPLIER = 1.0825 
        pre_tax = gross / TAX_RATE_MULTIPLIER
        tax = gross - pre_tax

        return Response({
            "data": {
                "totalSalesPreTax": pre_tax,
                "totalTax": tax,
                "grossSales": gross,
                "cashCount": stats['cash_sales'] or 0,
                "cardCount": stats['card_sales'] or 0,
                "voidCount": stats['void_count'] or 0
            }
        })

    @action(detail=False, methods=['get'])
    def product_usage(self, request):
        """Calculate ingredient usage via SQL Joins (Server-Side)."""
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        
        if not start or not end:
            return Response({"error": "Start and End dates required"}, status=400)
            
        usage = (
            RecipeItem.objects
            .filter(
                menu_item__orderitem__order__order_date_time__date__range=[start, end]
            )
            .exclude(menu_item__orderitem__order__payment_type='VOID')
            .values('ingredient__name', 'ingredient__unit__abbreviation')
            .annotate(
                # Use ExpressionWrapper for safe type calculation
                total_qty=Sum(
                    ExpressionWrapper(
                        F('quantity') * F('menu_item__orderitem__quantity'),
                        output_field=FloatField()
                    )
                )
            )
            .order_by('-total_qty')
        )
        
        data_list = [
            {
                "name": item['ingredient__name'],
                "quantity": item['total_qty'],
                "unit": item['ingredient__unit__abbreviation']
            }
            for item in usage
        ]

        return Response({ "data": data_list })

    @action(detail=False, methods=['get'])
    def popular_items(self, request):
        """Calculate most sold items (Server-Side)."""
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        
        if not start or not end:
            return Response({"error": "Start and End dates required"}, status=400)

        # Simplified Aggregation: Removed the complex ExpressionWrapper which was causing 500 errors.
        # Django's ORM usually handles Decimal * Integer math correctly without it.
        items = (
            OrderItem.objects
            .filter(order__order_date_time__date__range=[start, end])
            .exclude(order__payment_type='VOID')
            .values('menu_item__name', 'menu_item__category__name')
            .annotate(
                quantity=Sum('quantity'),
                revenue=Sum(F('quantity') * F('menu_item__base_price'))
            )
            .order_by('-revenue')
        )
        
        return Response({ "data": list(items) })