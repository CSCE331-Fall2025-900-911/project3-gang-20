from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Sum, Count, F, FloatField, Q, DecimalField, Max, ExpressionWrapper
from django.db.models.functions import TruncHour, Cast
from django.utils import timezone
import datetime
import itertools

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
    def x_report(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()

        # Include ALL orders (including VOID) to match Java logic where they show in the 'total_orders' count
        # and are then filtered out for the net totals.
        orders = Order.objects.filter(order_date_time__date=date)

        # We aggregate hourly but calculate components manually to mirror Java's logic
        # Java: Total Orders (count all distinct order IDs in that hour)
        # Java: Gross Sales (incl Tax) = Sum(Quantity * Price * 1.0825)
        # Java: Cash Sales (incl Tax) = Sum(Quantity * Price * 1.0825) where Type='Cash'
        
        TAX_RATE = 0.0825
        TAX_MULTIPLIER = 1 + TAX_RATE

        formatted_rows = []
        total_gross = 0.0
        
        # Group raw query by hour
        for hour, group in itertools.groupby(orders.annotate(h=TruncHour('order_date_time')).order_by('h'), key=lambda x: x.h):
            group_list = list(group)
            current_hour = hour.hour
            
            orders_count = len(group_list) # Java: counts all orders including voids
            
            hourly_gross = 0.0
            hourly_cash = 0.0
            hourly_card = 0.0
            hourly_voids = 0.0
            
            for o in group_list:
                # Subtotal is pre-tax in our model. Java calculates tax ON TOP of this.
                val_pre_tax = float(o.sub_total)
                val_with_tax = val_pre_tax * TAX_MULTIPLIER
                
                if o.payment_type == 'VOID':
                    hourly_voids += val_with_tax
                else:
                    hourly_gross += val_with_tax
                    if o.payment_type == 'Cash':
                        hourly_cash += val_with_tax
                    elif o.payment_type == 'Card':
                        hourly_card += val_with_tax
            
            display_gross = hourly_gross + hourly_voids 

            formatted_rows.append({
                "hour": current_hour,
                "orders": orders_count,
                "gross": display_gross,
                "cash": hourly_cash,
                "card": hourly_card,
                "voids": hourly_voids
            })
            
            total_gross += display_gross

        return Response({
            "rows": formatted_rows,
            "totals": { 
                "gross": total_gross
            }
        })

    @action(detail=False, methods=['get'])
    def z_report(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()

        orders = Order.objects.filter(order_date_time__date=date)
        
        # Calculate stats strictly matching Java Z-Report logic
        stats = orders.aggregate(
            total_sales=Sum('sub_total', filter=~Q(payment_type='VOID')),
            total_cash=Sum('sub_total', filter=Q(payment_type='Cash')),
            total_card=Sum('sub_total', filter=Q(payment_type='Card')),
            void_count=Count('id', filter=Q(payment_type='VOID')),
            void_value=Sum('sub_total', filter=Q(payment_type='VOID')),
        )
        
        # Java logic: 
        # total_sales_pre_tax = sum(qty * price) [raw]
        # total_tax = total_sales_pre_tax * 0.0825
        # Our model stores 'sub_total' which is pre-tax.
        
        pre_tax = float(stats['total_sales'] or 0)
        TAX_RATE = 0.0825
        TAX_MULTIPLIER = 1 + TAX_RATE
        tax = pre_tax * TAX_RATE
        gross = pre_tax + tax # Gross Sales (Incl. Tax)
        
        # Voids in Java Z-report display "Voided Orders Total Value". 
        # Is that value Pre-Tax or Post-Tax? 
        # Java code: `void_total_value` comes from `SUM(... * (1 + TAX_RATE))`
        # So we must apply tax to the void value for the display.
        void_pre_tax = float(stats['void_value'] or 0)
        void_value_display = void_pre_tax * (1 + TAX_RATE)

        # Employee List
        employees = orders.values_list('employee__first_name', 'employee__last_name').distinct()
        employee_names = [f"{e[0]} {e[1]}" for e in employees if e[0]]
        
        # ---- Add Hourly Breakdown (Requested in updated prompt) ----
        # Reusing logic from X-Report so Z-Report contains breakdown
        formatted_rows = []
        for hour, group in itertools.groupby(orders.annotate(h=TruncHour('order_date_time')).order_by('h'), key=lambda x: x.h):
            group_list = list(group)
            current_hour = hour.hour
            orders_count = len(group_list)
            
            hourly_gross = 0.0
            hourly_cash = 0.0
            hourly_card = 0.0
            hourly_voids = 0.0
            
            for o in group_list:
                val_pre_tax = float(o.sub_total)
                val_with_tax = val_pre_tax * TAX_MULTIPLIER
                
                if o.payment_type == 'VOID':
                    hourly_voids += val_with_tax
                else:
                    hourly_gross += val_with_tax
                    if o.payment_type == 'Cash':
                        hourly_cash += val_with_tax
                    elif o.payment_type == 'Card':
                        hourly_card += val_with_tax
            
            display_gross = hourly_gross + hourly_voids 
            formatted_rows.append({
                "hour": current_hour,
                "orders": orders_count,
                "gross": display_gross,
                "cash": hourly_cash,
                "card": hourly_card,
                "voids": hourly_voids
            })

        return Response({
            "data": {
                "totalSalesPreTax": pre_tax,
                "totalTax": tax,
                "grossSales": gross,
                "totalCash": float(stats['total_cash'] or 0) * (1 + TAX_RATE), # Cash is collected tax-inclusive
                "totalCard": float(stats['total_card'] or 0) * (1 + TAX_RATE), # Card is collected tax-inclusive
                "voidCount": stats['void_count'] or 0,
                "voidValue": void_value_display,
                "employees": employee_names,
                "date": str(date)
            },
            "hourly_breakdown": formatted_rows
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
                # Simple multiplication to get strict inventory usage amount
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

        items = (
            OrderItem.objects
            .filter(order__order_date_time__date__range=[start, end])
            .exclude(order__payment_type='VOID')
            .values('menu_item__name', 'menu_item__category__name')
            .annotate(
                total_qty=Sum('quantity'),
                total_sales=Sum(F('quantity') * F('menu_item__base_price'), output_field=DecimalField())
            )
            .order_by('-total_qty')
        )
        
        return Response({ "data": list(items) })