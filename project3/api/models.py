from django.db import models

class ApiMessage(models.Model):
    id = models.BigAutoField(primary_key=True)
    text = models.CharField(max_length=200)

    # We remove the 'Meta' class so Django manages this table.
    # class Meta:
    #     managed = False  <-- REMOVED
    #     db_table = 'api_message' <-- REMOVED (Django knows this)


# -----------------------------------------------------------------
# 2. YOUR PRE-EXISTING DATABASE MODELS
# -----------------------------------------------------------------
# These tables already exist, so we set 'managed = False'
# to tell Django not to try and change them with 'migrate'.

class Ingredients(models.Model):
    ingredient_id = models.CharField(primary_key=True, max_length=50)
    ingredient_name = models.CharField(max_length=100, blank=True, null=True)
    stock_level = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, blank=True, null=True)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'ingredients'
    
    def __str__(self):
        return self.ingredient_name


class AddOns(models.Model):
    id = models.IntegerField(primary_key=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    # I've converted this from a CharField to a proper ForeignKey
    # to link it to your Ingredients table.
    ingredient = models.ForeignKey(
        Ingredients, 
        on_delete=models.DO_NOTHING, 
        db_column='ingredient_id',  # This tells Django which column to use
        blank=True, 
        null=True
    )
    quantity = models.DecimalField(max_digits=5, decimal_places=3, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'add_ons'

    def __str__(self):
        return self.name


class Employees(models.Model):
    employee_id = models.IntegerField(primary_key=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    position = models.CharField(max_length=50, blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'employees'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class MenuItems(models.Model):
    menu_item_id = models.IntegerField(primary_key=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'menu_items'

    def __str__(self):
        return self.name


class Orders(models.Model):
    order_id = models.IntegerField(primary_key=True)
    order_date = models.DateField(blank=True, null=True)
    order_time = models.TimeField(blank=True, null=True)
    employee = models.ForeignKey(Employees, on_delete=models.DO_NOTHING, blank=True, null=True)
    payment_type = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'orders'


class OrderItems(models.Model):
    # inspectdb noted that your composite key (order_id, menu_item_id)
    # is not supported. It made 'order' the primary key as a workaround.
    # This is the standard Django way to handle this.
    order = models.OneToOneField(Orders, on_delete=models.DO_NOTHING, primary_key=True)
    menu_item = models.ForeignKey(MenuItems, on_delete=models.DO_NOTHING)
    quantity = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'order_items'
        unique_together = (('order', 'menu_item'),)


class RecipeItems(models.Model):
    # This is another composite key workaround
    menu_item = models.OneToOneField(MenuItems, on_delete=models.DO_NOTHING, primary_key=True)
    ingredient = models.ForeignKey(Ingredients, on_delete=models.DO_NOTHING)
    quantity = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        managed = False
        db_table = 'recipe_items'
        unique_together = (('menu_item', 'ingredient'),)
