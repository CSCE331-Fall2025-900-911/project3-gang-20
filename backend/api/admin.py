from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Customer, Employee, Unit, Ingredient, CustomizationCategory,
    CustomizationOption, MenuCategory, MenuItem, RecipeItem, Order, OrderItem
)

# -----------------------------------------------------------
# Inlines
# -----------------------------------------------------------

class RecipeItemInline(admin.TabularInline):
    """
    Allows editing RecipeItems directly within the MenuItem admin page.
    "TabularInline" provides a compact, table-based layout.
    """
    model = RecipeItem
    extra = 1  # Show 1 blank row by default
    autocomplete_fields = ['ingredient']  # Use a search-friendly dropdown

class OrderItemInline(admin.TabularInline):
    """
    Allows editing OrderItems directly within the Order admin page.
    """
    model = OrderItem
    extra = 1  # Show 1 blank "Add Item" row
    
    # Use search boxes and filter widgets for easier data entry
    autocomplete_fields = ['menu_item']
    filter_horizontal = ['customizations']

# -----------------------------------------------------------
# ModelAdmins
# -----------------------------------------------------------
# These classes customize the list display, search, and filtering
# for each model in the admin interface.

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    """Admin view for Ingredients."""
    list_display = ('name', 'stock_level', 'unit', 'low_stock_threshold')
    list_filter = ('unit',)
    search_fields = ('name',)

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    """Admin view for Menu Categories."""
    search_fields = ('name',)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    """Admin view for Menu Items."""
    # Add 'image_tag' to your list_display
    list_display = ('name', 'category', 'base_price', 'image_tag') 
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [RecipeItemInline]
    autocomplete_fields = ('category',)
    
    # Add this to see the image in the admin list view
    readonly_fields = ('image_tag',) # Also show in detail view

    @admin.display(description='Image')
    def image_tag(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px;" />', 
                obj.image.url
            )
        return "No Image"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin view for Orders."""
    list_display = ('id', 'order_date_time', 'employee', 'customer', 'payment_type')
    list_filter = ('order_date_time', 'payment_type', 'employee')
    inlines = [OrderItemInline]  # Nest the order item editor
    autocomplete_fields = ('employee', 'customer')

@admin.register(CustomizationOption)
class CustomizationOptionAdmin(admin.ModelAdmin):
    """Admin view for Customization Options."""
    list_display = ('name', 'category', 'price', 'quantity') # Removed 'unit'
    list_filter = ('category',)
    search_fields = ('name',)
    autocomplete_fields = ('category', 'ingredient') # Removed 'unit'

@admin.register(CustomizationCategory)
class CustomizationCategoryAdmin(admin.ModelAdmin):
    """Admin view for Customization Categories."""
    search_fields = ('name',)

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Admin view for Customers."""
    list_display = ('first_name', 'last_name', 'email', 'phone') 
    search_fields = ('first_name', 'last_name', 'email', 'phone')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    """Admin view for Employees."""
    list_display = ('first_name', 'last_name', 'position')
    search_fields = ('first_name', 'last_name')

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    """Admin view for Units."""
    search_fields = ('name', 'abbreviation')

# -----------------------------------------------------------
# Register remaining simple models
# -----------------------------------------------------------
# admin.site.register(Unit) # This is now handled by the @admin.register decorator above