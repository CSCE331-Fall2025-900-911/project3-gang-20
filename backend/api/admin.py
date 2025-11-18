from django.contrib import admin
from .models import (
    Customer, Employee, Ingredient, CustomizationCategory,
    CustomizationOption, MenuItem, RecipeItem, Order, OrderItem, MenuCategory, Unit
)

class RecipeItemInline(admin.TabularInline):
    """
    This lets you edit RecipeItems (ingredients) *inside* the MenuItem page.
    """
    model = RecipeItem
    extra = 1 # Show 1 blank row for adding

class OrderItemInline(admin.TabularInline):
    """
    This lets you see the OrderItems *inside* the Order page.
    """
    model = OrderItem
    extra = 0 # Don't show blank rows (orders shouldn't be edited here)
    readonly_fields = ['menu_item', 'quantity', 'customizations']
    can_delete = False

class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'stock_level', 'unit']
    list_filter = ['unit']
    search_fields = ['name']

class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'base_price']
    search_fields = ['name']
    
    list_filter = ['category']
    inlines = [RecipeItemInline]
    
    filter_horizontal = ['available_customizations']

class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'order_date_time', 'customer', 'employee', 'payment_type']
    list_filter = ['order_date_time', 'payment_type']
    inlines = [OrderItemInline]

# --- Register all your models ---
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Ingredient, IngredientAdmin)

admin.site.register(MenuCategory)
admin.site.register(Customer)
admin.site.register(Employee)
admin.site.register(Unit)
admin.site.register(CustomizationCategory)
admin.site.register(CustomizationOption)