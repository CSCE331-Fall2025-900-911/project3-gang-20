from django.db import models

class Customer(models.Model):
    """
    Represents a customer, typically for loyalty or order history.
    """
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    joined_date = models.DateField(auto_now_add=True)
    points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Employee(models.Model):
    """
    Represents an employee who can be associated with orders.
    """
    # This field is for mapping to an old system, if necessary.
    legacy_employee_id = models.IntegerField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    position = models.CharField(max_length=50, blank=True)
    hire_date = models.DateField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Unit(models.Model):
    """
    Stores units of measurement (e.g., "Ounce", "Pump", "Scoop").
    """
    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.abbreviation  # e.g., "oz", "scoop"

class Ingredient(models.Model):
    """
    Represents a single inventory item (e.g., "Tapioca Pearls", "Black Tea").
    """
    legacy_ingredient_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    name = models.CharField(max_length=100, unique=True)
    stock_level = models.DecimalField(max_digits=10, decimal_places=2)
    
    unit = models.ForeignKey(
        Unit, 
        on_delete=models.PROTECT, # Prevents deleting a Unit if it's still in use
        blank=True, 
        null=True
    )
    
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class CustomizationCategory(models.Model):
    """
    A category for add-ons (e.g., "Toppings", "Ice Level", "Sweetness").
    """
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

class CustomizationOption(models.Model):
    """
    A specific add-on option (e.g., "Boba", "50% Ice", "Extra Sweet").
    """
    legacy_addon_id = models.IntegerField(unique=True, null=True, blank=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    category = models.ForeignKey(CustomizationCategory, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(
        Ingredient, 
        on_delete=models.SET_NULL, # Keep the option even if the ingredient is deleted
        blank=True, 
        null=True
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)    
    def __str__(self):
        """Friendly string representation, e.g., "Toppings: Boba (+$0.75)"""
        return f"{self.category.name}: {self.name} (+${self.price})"

class MenuCategory(models.Model):
    """
    A category for menu items (e.g., "Milk Teas", "Fruit Teas", "Snacks").
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Menu Categories"

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    """
    A single item on the menu (e.g., "Classic Milk Tea").
    """
    name = models.CharField(max_length=100, unique=True)
    legacy_menu_item_id = models.IntegerField(unique=True, null=True, blank=True)
    
    category = models.ForeignKey(
        MenuCategory, 
        on_delete=models.SET_NULL, # Keep the drink even if the category is deleted
        blank=True, 
        null=True
    )

    image = models.ImageField(
        upload_to='menu_items/',  # Will save to /media/menu_items/filename.jpg
        blank=True, 
        null=True
    )
    
    base_price = models.DecimalField(max_digits=5, decimal_places=2)

    # Defines the base recipe via the 'RecipeItem' model
    ingredients = models.ManyToManyField(
        Ingredient,
        through='RecipeItem', 
        related_name='menu_items'
    )
    
    # Defines which customization *categories* are allowed for this item
    # available_customizations = models.ManyToManyField(
    #     CustomizationCategory,
    #     blank=True
    # )

    def __str__(self):
        return self.name

class RecipeItem(models.Model):
    """
    This is a "through" model connecting a MenuItem to an Ingredient
    and specifying the quantity needed for the recipe.
    """
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        # Ensures an ingredient can't be listed twice for the same menu item
        unique_together = (('menu_item', 'ingredient'),)
    
    def __str__(self):
        return f"{self.menu_item.name} uses {self.quantity} {self.ingredient.unit} of {self.ingredient.name}"


class Order(models.Model):
    """
    Represents a single customer order (the "receipt").
    """
    order_date_time = models.DateTimeField(auto_now_add=True)
    payment_type = models.CharField(max_length=20) # e.g., "Cash", "Card"
    sub_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    customer = models.ForeignKey(
        Customer, 
        on_delete=models.SET_NULL, # Keep order history if customer is deleted
        blank=True, 
        null=True
    )
    
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.SET_NULL, # Keep order history if employee is terminated
        blank=True, 
        null=True
    )

    def __str__(self):
        return f"Order #{self.id} on {self.order_date_time.strftime('%Y-%m-%d')}"

class OrderItem(models.Model):
    """
    Represents a single line item within an Order.
    (e.g., "1x Classic Milk Tea").
    """
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE,  # If the Order is deleted, delete its items
        related_name='items'      # Allows us to use `order.items.all()`
    )
    
    menu_item = models.ForeignKey(
        MenuItem, 
        on_delete=models.PROTECT # Don't allow deleting a MenuItem if orders exist
    )
    quantity = models.PositiveIntegerField(default=1)
    
    # Stores the specific options chosen (e.g., "Boba", "50% Ice")
    customizations = models.ManyToManyField(
        CustomizationOption,
        blank=True # An item can have no customizations
    )
    
    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} for Order # {self.order.id}"