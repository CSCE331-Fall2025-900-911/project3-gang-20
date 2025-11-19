from django.db import models

class Customer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    joined_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Employee(models.Model):
    # add section for employement status - so we don't have to set to null if fired...
    legacy_employee_id = models.IntegerField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    position = models.CharField(max_length=50, blank=True)
    hire_date = models.DateField(blank=True, null=True)
    
    legacy_employee_id = models.IntegerField(unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Unit(models.Model):
    """
    Stores units of measurement (e.g., "Ounce", "Pound", "Count")
    """
    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.abbreviation

class Ingredient(models.Model):
    legacy_ingredient_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    name = models.CharField(max_length=100, unique=True)
    stock_level = models.DecimalField(max_digits=10, decimal_places=2)
    
    unit = models.ForeignKey(
        Unit, 
        on_delete=models.PROTECT, # Don't delete a unit if ingredients use it
        blank=True, 
        null=True
    )
    
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class CustomizationCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

class CustomizationOption(models.Model):
    legacy_addon_id = models.IntegerField(unique=True, null=True, blank=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Link the option to its category (e.g., "Boba" -> "Toppings")
    category = models.ForeignKey(CustomizationCategory, on_delete=models.CASCADE)
    
    # Optionally, link to an ingredient for inventory tracking
    ingredient = models.ForeignKey(
        Ingredient, 
        on_delete=models.SET_NULL, # Don't delete option if ingredient is deleted
        blank=True, 
        null=True
    )

    def __str__(self):
        return f"{self.category.name}: {self.name} (+${self.price})"

class MenuCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Menu Categories"

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    legacy_menu_item_id = models.IntegerField(unique=True, null=True, blank=True)
    category = models.ForeignKey(
        MenuCategory, 
        on_delete=models.SET_NULL, # Don't delete drinks if category is deleted
        blank=True, 
        null=True
    )
    
    base_price = models.DecimalField(max_digits=5, decimal_places=2)

    ingredients = models.ManyToManyField(
        Ingredient,
        through='RecipeItem', 
        related_name='menu_items'
    )
    
    available_customizations = models.ManyToManyField(
        CustomizationCategory,
        blank=True
    )

    def __str__(self):
        return self.name

class RecipeItem(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        unique_together = (('menu_item', 'ingredient'),)
    
    def __str__(self):
        return f"{self.menu_item.name} uses {self.quantity} {self.ingredient.unit} of {self.ingredient.name}"


class Order(models.Model):
    order_date_time = models.DateTimeField(auto_now_add=True)
    payment_type = models.CharField(max_length=20) # "Cash", "Card"
    
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.SET_NULL, # Keep order even if customer is deleted
        blank=True, 
        null=True
    )
    
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.SET_NULL, # Keep order even if employee is fired
        blank=True, 
        null=True
    )
    
    # add method later
    # total_price = models.DecimalField(...)

    def __str__(self):
        return f"Order #{self.id} on {self.order_date_time.strftime('%Y-%m-%d')}"

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name='items' # Allows us to do order.items.all()
    )
    
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT) # Don't delete item if orders exist
    quantity = models.PositiveIntegerField(default=1)
    
    # (e.g., "Boba", "50% Ice")
    customizations = models.ManyToManyField(
        CustomizationOption,
        blank=True # Can be blank if no customizations
    )
    
    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} for Order # {self.order.id}"