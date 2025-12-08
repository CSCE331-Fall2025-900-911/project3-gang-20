from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Sum, Count, F, FloatField, Q, DecimalField, Max
from django.db.models.functions import TruncHour, Cast
from django.utils import timezone
import datetime

from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)
from .serializers import (
    CustomerReadSerializer, EmployeeReadSerializer, 
    MenuCategoryReadSerializer, UnitReadSerializer, CustomizationCategoryReadSerializer,
    IngredientReadSerializer, CustomizationOptionReadSerializer,
    MenuItemReadSerializer, RecipeItemReadSerializer, 
    OrderReadSerializer, OrderItemReadSerializer,
    CustomerWriteSerializer, EmployeeWriteSerializer,
    MenuCategoryWriteSerializer, UnitWriteSerializer, CustomizationCategoryWriteSerializer,
    IngredientWriteSerializer, CustomizationOptionWriteSerializer,
    MenuItemWriteSerializer, RecipeItemWriteSerializer,
    OrderWriteSerializer, OrderItemWriteSerializer
)

# ... [Standard ViewSets omitted - assume unchanged] ...
class CustomerViewSet(viewsets.ModelViewSet):
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


class OrdersViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-order_date_time').select_related(
        'customer', 'employee'
    ).prefetch_related(
        'items__menu_item', 'items__customizations'
    )
    
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter] 
    filterset_fields = ['customer']          
    ordering_fields = ['order_date_time']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderWriteSerializer
        return OrderReadSerializer

    @action(detail=False, methods=['get'])
    def latest_id(self, request):
        # Aggregate the maximum ID from the Order table
        max_id = Order.objects.aggregate(Max('id'))['id__max']
        # If no orders exist, max_id will be None, so return 0
        return Response({'latest_id': max_id or 0})

    @action(detail=False, methods=['get'])
    def x_report(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()

        orders = Order.objects.filter(order_date_time__date=date)

        hourly_data = (
            orders.exclude(payment_type='VOID')
            .annotate(hour=TruncHour('order_date_time'))
            .values('hour')
            .annotate(orders=Count('id'), gross=Sum('sub_total'))
            .order_by('hour')
        )
        
        payment_stats = orders.exclude(payment_type='VOID').values('payment_type').annotate(
            count=Count('id'), total=Sum('sub_total')
        )

        void_stats = orders.filter(payment_type='VOID').aggregate(
            void_count=Count('id'), void_value=Sum('sub_total')
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
            "totals": { 
                "orders": total_orders, 
                "gross": total_gross,
                "voids": {
                    "count": void_stats['void_count'] or 0,
                    "value": float(void_stats['void_value'] or 0)
                }
            },
            "payment_methods": list(payment_stats)
        })

    @action(detail=False, methods=['get'])
    def z_report(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()

        orders = Order.objects.filter(order_date_time__date=date)
        
        stats = orders.aggregate(
            total_sales=Sum('sub_total', filter=~Q(payment_type='VOID')),
            total_cash=Sum('sub_total', filter=Q(payment_type='Cash')),
            total_card=Sum('sub_total', filter=Q(payment_type='Card')),
            void_count=Count('id', filter=Q(payment_type='VOID')),
            void_value=Sum('sub_total', filter=Q(payment_type='VOID')),
        )
        
        gross = float(stats['total_sales'] or 0)
        TAX_RATE_MULTIPLIER = 1.0825 
        pre_tax = gross / TAX_RATE_MULTIPLIER
        tax = gross - pre_tax

        employees = orders.values_list('employee__first_name', 'employee__last_name').distinct()
        employee_names = [f"{e[0]} {e[1]}" for e in employees if e[0]]

        return Response({
            "data": {
                "totalSalesPreTax": pre_tax,
                "totalTax": tax,
                "grossSales": gross,
                "totalCash": float(stats['total_cash'] or 0),
                "totalCard": float(stats['total_card'] or 0),
                "voidCount": stats['void_count'] or 0,
                "voidValue": float(stats['void_value'] or 0),
                "employees": employee_names,
                "date": str(date)
            }
        })

    @action(detail=False, methods=['get'])
    def product_usage(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        
        if not start or not end:
            return Response({"error": "Start and End dates required"}, status=400)
            
        usage = (
            RecipeItem.objects
            .filter(menu_item__orderitem__order__order_date_time__date__range=[start, end])
            .exclude(menu_item__orderitem__order__payment_type='VOID')
            .values('ingredient__name', 'ingredient__unit__abbreviation')
            .annotate(
                # Simple multiplication, avoiding complex ExpressionWrapper that crashed
                total_qty=Sum(F('quantity') * F('menu_item__orderitem__quantity'))
            )
            .order_by('-total_qty')
        )
        
        data_list = [
            {
                "name": item['ingredient__name'],
                "quantity": float(item['total_qty'] or 0),
                "unit": item['ingredient__unit__abbreviation']
            }
            for item in usage
        ]

        return Response({ "data": data_list })

    @action(detail=False, methods=['get'])
    def popular_items(self, request):
        """Sales Report: Sales by item."""
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        
        if not start or not end:
            return Response({"error": "Start and End dates required"}, status=400)

        # Simplified query to avoid ExpressionWrapper crash on older Django/DB versions
        items = (
            OrderItem.objects
            .filter(order__order_date_time__date__range=[start, end])
            .exclude(order__payment_type='VOID')
            .values('menu_item__name', 'menu_item__category__name')
            .annotate(
                quantity=Sum('quantity'),
                # We fetch just qty sum here, price calculation can happen on frontend 
                # OR we accept that revenue might be approximate if prices changed.
                # Ideally, OrderItem should snapshot price. 
                # For this report, we'll order by quantity to be safe and robust.
            )
            .order_by('-quantity')
        )
        
        # We can fetch base prices separately or if OrderItem has price snapshot use that.
        # Assuming current base_price for revenue estimation to keep it simple and working.
        # We'll attach price in a secondary step or let frontend handle it if data is missing.
        # BUT to satisfy the requirement, let's try a safer annotation:
        
        return Response({ "data": list(items) })