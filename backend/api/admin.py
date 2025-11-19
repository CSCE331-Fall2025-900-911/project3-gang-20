from django.contrib import admin
from .models import (
    Customer, Employee, Unit, Ingredient, CustomizationCategory,
    CustomizationOption, MenuCategory, MenuItem, RecipeItem, Order, OrderItem
)

# -----------------------------------------------------------
# Inlines
# -----------------------------------------------------------

class RecipeItemInline(admin.TabularInline):
    """
    Lets you add ingredients to a menu item.
    """
    model = RecipeItem
    extra = 1  # Show 1 blank row by default
    autocomplete_fields = ['ingredient']  # Use a search box

# ⬇️ --- THIS IS THE FIX --- ⬇️
class OrderItemInline(admin.TabularInline):
    """
    This "inline" editor will let you ADD items to an Order.
    """
    model = OrderItem
    extra = 1  # Show 1 blank "Add Item" row
    
    # We REMOVED readonly_fields to make it editable
    
    # Use a search box for the menu item
    autocomplete_fields = ['menu_item']
    
    # Use a nice dual-select box for customizations
    filter_horizontal = ['customizations']
# ⬆️ --------------------------------


# -----------------------------------------------------------
# ModelAdmins
# -----------------------------------------------------------

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'stock_level', 'unit', 'low_stock_threshold')
    list_filter = ('unit',)
    search_fields = ('name',)

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    search_fields = ('name',)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'base_price')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [RecipeItemInline]
    autocomplete_fields = ('category',)
    filter_horizontal = ('available_customizations',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_date_time', 'employee', 'customer', 'payment_type')
    list_filter = ('order_date_time', 'payment_type', 'employee')
    
    # This line uses the new, FIXED inline
    inlines = [OrderItemInline]
    
    autocomplete_fields = ('employee', 'customer')

@admin.register(CustomizationOption)
class CustomizationOptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    autocomplete_fields = ('category', 'ingredient')

@admin.register(CustomizationCategory)
class CustomizationCategoryAdmin(admin.ModelAdmin):
    search_fields = ('name',)

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    # Use fields that exist on your Customer model
    # For example, if you only have 'email'
    list_display = ('email',) 
    search_fields = ('email',)

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'position')
    search_fields = ('first_name', 'last_name')

# -----------------------------------------------------------
# Register remaining models
# -----------------------------------------------------------
admin.site.register(Unit)