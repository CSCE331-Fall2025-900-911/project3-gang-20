import pandas as pd
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps 
from api.models import (
    Unit, MenuCategory, CustomizationCategory,
    Employee, Ingredient, MenuItem, CustomizationOption, RecipeItem
)

APP_DIR = apps.get_app_config('api').path
DATA_DIR = os.path.join(APP_DIR, 'management', 'csv_data')

UNIT_CSV = os.path.join(DATA_DIR, "ingredients.csv")
MENU_CAT_CSV = os.path.join(DATA_DIR, "menu_items.csv")
CUSTOM_CAT_CSV = os.path.join(DATA_DIR, "add_ons.csv")
EMPLOYEE_CSV = os.path.join(DATA_DIR, "employees.csv")
INGREDIENT_CSV = os.path.join(DATA_DIR, "ingredients.csv")
MENU_ITEM_CSV = os.path.join(DATA_DIR, "menu_items.csv")
ADDON_CSV = os.path.join(DATA_DIR, "add_ons.csv")
RECIPE_CSV = os.path.join(DATA_DIR, "recipe_items.csv")

class Command(BaseCommand):
    help = 'Populates the database from the old CSV files.'

    @transaction.atomic 
    def handle(self, *args, **options):
        self.stdout.write("Starting Database Population")

        self.run_stage_1()
        self.run_stage_2()
        self.run_stage_3()

        self.stdout.write(self.style.SUCCESS("Database Population Complete"))

    def run_stage_1(self):
        self.stdout.write("Running Stage 1: Creating Lookup Tables")

        # 1. Create Unit objects
        df_ing = pd.read_csv(UNIT_CSV)
        unique_units = df_ing['unit'].unique()
        # We must map abbreviations to full names
        unit_map = {
            'gal': 'Gallon',
            'lb': 'Pound',
            'can': 'Can',
            'bottle': 'Bottle',
            'piece': 'Piece',
        }
        for abbr in unique_units:
            name = unit_map.get(abbr, abbr.capitalize()) # Guess name if not in map
            Unit.objects.get_or_create(name=name, abbreviation=abbr)
        self.stdout.write(f"  Created/Updated {len(unique_units)} Units.")

        # 2. Create MenuCategory objects
        df_menu = pd.read_csv(MENU_CAT_CSV)
        unique_menu_cats = df_menu['category'].unique()
        for name in unique_menu_cats:
            MenuCategory.objects.get_or_create(name=name)
        self.stdout.write(f"  Created/Updated {len(unique_menu_cats)} Menu Categories.")

        # 3. Create CustomizationCategory objects
        df_addons = pd.read_csv(CUSTOM_CAT_CSV)
        unique_custom_cats = df_addons['category'].unique()
        for name in unique_custom_cats:
            CustomizationCategory.objects.get_or_create(name=name)
        self.stdout.write(f"  Created/Updated {len(unique_custom_cats)} Customization Categories.")

    def run_stage_2(self):
        self.stdout.write("Running Stage 2: Importing Main Data...")

        # 1. Import Employees
        df_emp = pd.read_csv(EMPLOYEE_CSV)
        for _, row in df_emp.iterrows():
            Employee.objects.get_or_create(
                legacy_employee_id=row['employee_id'],
                defaults={
                    'first_name': row['first_name'],
                    'last_name': row['last_name'],
                    'position': row['position'],
                    'hire_date': row['hire_date'],
                }
            )
        self.stdout.write(f"  Imported {len(df_emp)} Employees.")

        # 2. Import Ingredients
        df_ing = pd.read_csv(INGREDIENT_CSV)
        for _, row in df_ing.iterrows():
            unit_obj = Unit.objects.get(abbreviation=row['unit'])
            Ingredient.objects.get_or_create(
                legacy_ingredient_id=row['ingredient_id'],
                defaults={
                    'name': row['ingredient_name'],
                    'stock_level': row['stock_level'],
                    'unit': unit_obj,
                    'low_stock_threshold': row['low_stock_threshold'],
                }
            )
        self.stdout.write(f"  Imported {len(df_ing)} Ingredients.")

        # 3. Import MenuItems
        df_menu = pd.read_csv(MENU_ITEM_CSV)
        for _, row in df_menu.iterrows():
            cat_obj = MenuCategory.objects.get(name=row['category'])
            MenuItem.objects.get_or_create(
                legacy_menu_item_id=row['menu_item_id'],
                defaults={
                    'name': row['name'],
                    'category': cat_obj,
                    'base_price': row['price'],
                }
            )
        self.stdout.write(f"  Imported {len(df_menu)} Menu Items.")

        # 4. Import CustomizationOptions (from add_ons.csv)
        df_addons = pd.read_csv(ADDON_CSV)
        for _, row in df_addons.iterrows():
            cat_obj = CustomizationCategory.objects.get(name=row['category'])
            # Find the linked ingredient
            ingredient_obj = Ingredient.objects.get(legacy_ingredient_id=row['ingredient_id'])
            CustomizationOption.objects.get_or_create(
                legacy_addon_id=row['id'],
                defaults={
                    'name': row['name'],
                    'price': row['price'],
                    'category': cat_obj,
                    'ingredient': ingredient_obj,
                }
            )
        self.stdout.write(f"  Imported {len(df_addons)} Customization Options.")

    def run_stage_3(self):
        self.stdout.write("Running Stage 3: Importing Linking Data")
        
        # 1. Import RecipeItems
        df_recipe = pd.read_csv(RECIPE_CSV)
        # Clear existing recipes to avoid duplicates on re-run
        RecipeItem.objects.all().delete() 
        
        recipes_to_create = []
        for _, row in df_recipe.iterrows():
            try:
                # Find the objects using the legacy IDs we stored
                menu_item_obj = MenuItem.objects.get(legacy_menu_item_id=row['menu_item_id'])
                ingredient_obj = Ingredient.objects.get(legacy_ingredient_id=row['ingredient_id'])
                
                recipes_to_create.append(
                    RecipeItem(
                        menu_item=menu_item_obj,
                        ingredient=ingredient_obj,
                        quantity=row['quantity']
                    )
                )
            except MenuItem.DoesNotExist:
                self.stdout.write(f"  Skipping recipe: No MenuItem with legacy_id={row['menu_item_id']}")
            except Ingredient.DoesNotExist:
                 self.stdout.write(f"  Skipping recipe: No Ingredient with legacy_id={row['ingredient_id']}")

        # Create all recipes in one go (much faster)
        RecipeItem.objects.bulk_create(recipes_to_create)
        self.stdout.write(f"  Imported {len(recipes_to_create)} Recipe Items.")