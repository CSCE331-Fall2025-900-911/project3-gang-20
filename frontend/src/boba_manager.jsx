/*
  File: boba_manager.jsx
  Description: The Manager Dashboard application.
  Provides comprehensive management capabilities including:
  - Menu Item management (CRUD, Recipe management)
  - Inventory tracking (Ingredients, Stock levels)
  - Employee management
  - Sales and Inventory Reports (X-Report, Z-Report, Low Stock)
*/

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = 'https://project3-gang-20.onrender.com/api';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/*
  Main Manager Dashboard Component.
  Orchestrates the different management views and handles initial data loading.
*/
function BobaManager({ onBack }) {
  // Current view state
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'inventory', 'employees', 'product-usage', 'sales-report', 'x-report', 'z-report'

  // Data state
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [ingredientsRes, menuRes, employeesRes, recipesRes, unitsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/ingredients/`),
        fetch(`${API_BASE}/menu-items/`),
        fetch(`${API_BASE}/employees/`),
        fetch(`${API_BASE}/recipe-items/`),
        fetch(`${API_BASE}/units/`),
        fetch(`${API_BASE}/menu-categories/`)
      ]);

      // Check for response errors
      const checkResponse = async (res, name) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to fetch ${name}:`, res.status, errorText);
          throw new Error(`Failed to fetch ${name}: ${res.status} ${res.statusText}`);
        }
        return res.json();
      };

      const [ingredientsData, menuData, employeesData, recipesData, unitsData, categoriesData] = await Promise.all([
        checkResponse(ingredientsRes, 'ingredients'),
        checkResponse(menuRes, 'menu-items'),
        checkResponse(employeesRes, 'employees'),
        checkResponse(recipesRes, 'recipe-items'),
        checkResponse(unitsRes, 'units'),
        checkResponse(categoriesRes, 'menu-categories')
      ]);

      setIngredients(ingredientsData);
      setMenuItems(menuData);
      setEmployees(employeesData);
      setRecipeItems(recipesData);
      setUnits(unitsData);
      setMenuCategories(categoriesData);

      console.log('Data loaded successfully:', {
        ingredients: ingredientsData.length,
        menuItems: menuData.length,
        employees: employeesData.length,
        recipeItems: recipesData.length,
        units: unitsData.length,
        categories: categoriesData.length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      alert(`Error loading data: ${error.message}\n\nPlease check the browser console for details.`);
    }
  };

  const reloadCurrentView = async () => {
    setLoading(true);
    try {
      if (currentView === 'menu') {
        const [menuRes, recipesRes] = await Promise.all([
          fetch(`${API_BASE}/menu-items/`),
          fetch(`${API_BASE}/recipe-items/`)
        ]);

        if (!menuRes.ok) throw new Error(`Failed to fetch menu items: ${menuRes.status}`);
        if (!recipesRes.ok) throw new Error(`Failed to fetch recipes: ${recipesRes.status}`);

        setMenuItems(await menuRes.json());
        setRecipeItems(await recipesRes.json());
      } else if (currentView === 'inventory') {
        const res = await fetch(`${API_BASE}/ingredients/`);
        if (!res.ok) throw new Error(`Failed to fetch ingredients: ${res.status}`);
        setIngredients(await res.json());
      } else if (currentView === 'employees') {
        const res = await fetch(`${API_BASE}/employees/`);
        if (!res.ok) throw new Error(`Failed to fetch employees: ${res.status}`);
        setEmployees(await res.json());
      }
    } catch (error) {
      console.error('Failed to reload data:', error);
      alert(`Error reloading data: ${error.message}`);
    }
    setLoading(false);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAdd = () => {
    setSelectedItem(null);
    setShowAddDialog(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = async (item) => {
    const itemName = item.name || `${item.first_name} ${item.last_name}`;
    if (!window.confirm(`Are you sure you want to delete: ${itemName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const endpoint = currentView === 'menu' ? 'menu-items' :
        currentView === 'inventory' ? 'ingredients' : 'employees';

      const res = await fetch(`${API_BASE}/${endpoint}/${item.id}/`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Delete failed');
      }

      alert(`✓ Successfully deleted: ${itemName}`);
      reloadCurrentView();
    } catch (error) {
      alert(`❌ Failed to delete: ${error.message}`);
    }
  };

  const handleCloseDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setSelectedItem(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto flex">
          <button
            onClick={() => setCurrentView('menu')}
            className={`px-6 py-4 font-semibold ${currentView === 'menu'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            Menu Items
          </button>
          <button
            onClick={() => setCurrentView('inventory')}
            className={`px-6 py-4 font-semibold ${currentView === 'inventory'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setCurrentView('employees')}
            className={`px-6 py-4 font-semibold ${currentView === 'employees'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            Employees
          </button>
          <button
            onClick={() => setCurrentView('product-usage')}
            className={`px-6 py-4 font-semibold ${currentView === 'product-usage'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            Product Usage
          </button>
          <button
            onClick={() => setCurrentView('sales-report')}
            className={`px-6 py-4 font-semibold ${currentView === 'sales-report'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setCurrentView('x-report')}
            className={`px-6 py-4 font-semibold ${currentView === 'x-report'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
              }`}
          >
            X-Report
          </button>
          <button
            onClick={() => setCurrentView('z-report')}
            className={`px-6 py-4 font-semibold ${currentView === 'z-report'
              ? 'border-b-4 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-red-600'
              }`}
          >
            Z-Report
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Actions Bar - Hide for Product Usage, Sales Report, X-Report, and Z-Report views */}
        {currentView !== 'product-usage' && currentView !== 'sales-report' && currentView !== 'x-report' && currentView !== 'z-report' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              <Plus size={20} />
              Add New {currentView === 'menu' ? 'Menu Item' : currentView === 'inventory' ? 'Ingredient' : 'Employee'}
            </button>
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg text-gray-700 mt-4">Loading...</p>
          </div>
        ) : currentView === 'menu' ? (
          <MenuItemsTable items={menuItems} onEdit={handleEdit} onDelete={handleDelete} recipeItems={recipeItems} />
        ) : currentView === 'inventory' ? (
          <InventoryTable items={ingredients} onEdit={handleEdit} onDelete={handleDelete} />
        ) : currentView === 'employees' ? (
          <EmployeesTable items={employees} onEdit={handleEdit} onDelete={handleDelete} />
        ) : currentView === 'product-usage' ? (
          <ProductUsageView ingredients={ingredients} recipeItems={recipeItems} />
        ) : currentView === 'sales-report' ? (
          <SalesReportView menuItems={menuItems} />
        ) : currentView === 'x-report' ? (
          <XReportView />
        ) : currentView === 'z-report' ? (
          <ZReportView />
        ) : null}
      </div>

      {/* Add Dialog */}
      {showAddDialog && currentView === 'menu' && (
        <AddMenuItemDialog
          onClose={handleCloseDialogs}
          onSuccess={() => { handleCloseDialogs(); reloadCurrentView(); }}
          ingredients={ingredients}
          menuCategories={menuCategories}
        />
      )}
      {showAddDialog && currentView === 'inventory' && (
        <AddIngredientDialog
          onClose={handleCloseDialogs}
          onSuccess={() => { handleCloseDialogs(); reloadCurrentView(); }}
          units={units}
        />
      )}
      {showAddDialog && currentView === 'employees' && (
        <AddEmployeeDialog
          onClose={handleCloseDialogs}
          onSuccess={() => { handleCloseDialogs(); reloadCurrentView(); }}
        />
      )}

      {/* Edit Dialog */}
      {showEditDialog && selectedItem && currentView === 'menu' && (
        <EditMenuItemDialog
          item={selectedItem}
          onClose={handleCloseDialogs}
          onSuccess={() => { handleCloseDialogs(); reloadCurrentView(); }}
          ingredients={ingredients}
          menuCategories={menuCategories}
          recipeItems={recipeItems}
        />
      )}
      {showEditDialog && selectedItem && currentView === 'inventory' && (
        <EditIngredientDialog
          item={selectedItem}
          onClose={handleCloseDialogs}
          onSuccess={() => { handleCloseDialogs(); reloadCurrentView(); }}
          units={units}
        />
      )}
      {showEditDialog && selectedItem && currentView === 'employees' && (
        <EditEmployeeDialog
          item={selectedItem}
          onClose={handleCloseDialogs}
          onSuccess={() => { handleCloseDialogs(); reloadCurrentView(); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// TABLE COMPONENTS
// ============================================================================

function MenuItemsTable({ items, onEdit, onDelete, recipeItems }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-lg text-gray-700">No menu items found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3 text-left font-semibold">ID</th>
            <th className="p-3 text-left font-semibold">Name</th>
            <th className="p-3 text-left font-semibold">Category</th>
            <th className="p-3 text-left font-semibold">Price</th>
            <th className="p-3 text-left font-semibold">Recipe</th>
            <th className="p-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const recipes = recipeItems.filter(r => r.menu_item === item.id);
            return (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.id}</td>
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">{item.category || 'N/A'}</td>
                <td className="p-3">${parseFloat(item.base_price).toFixed(2)}</td>
                <td className="p-3">
                  {recipes.length > 0 ? (
                    <div className="text-sm">
                      {recipes.map((r, idx) => (
                        <div key={idx}>
                          {r.ingredient}: {r.quantity} {r.unit}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No recipe</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InventoryTable({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-lg text-gray-700">No ingredients found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3 text-left font-semibold">ID</th>
            <th className="p-3 text-left font-semibold">Name</th>
            <th className="p-3 text-left font-semibold">Stock Level</th>
            <th className="p-3 text-left font-semibold">Unit</th>
            <th className="p-3 text-left font-semibold">Low Stock Threshold</th>
            <th className="p-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isLowStock = item.stock_level <= item.low_stock_threshold;
            return (
              <tr key={item.id} className={`border-b hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                <td className="p-3">{item.id}</td>
                <td className="p-3 font-semibold">
                  {item.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </td>
                <td className={`p-3 font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                  {item.stock_level}
                </td>
                <td className="p-3">{item.unit}</td>
                <td className="p-3">{item.low_stock_threshold}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmployeesTable({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-lg text-gray-700">No employees found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3 text-left font-semibold">ID</th>
            <th className="p-3 text-left font-semibold">First Name</th>
            <th className="p-3 text-left font-semibold">Last Name</th>
            <th className="p-3 text-left font-semibold">Position</th>
            <th className="p-3 text-left font-semibold">Hire Date</th>
            <th className="p-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{item.id}</td>
              <td className="p-3">{item.first_name}</td>
              <td className="p-3">{item.last_name}</td>
              <td className="p-3">{item.position}</td>
              <td className="p-3">{new Date(item.hire_date).toLocaleDateString()}</td>
              <td className="p-3">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductUsageView({ ingredients, recipeItems }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateUsage = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }

    setLoading(true);
    setHasCalculated(false);

    try {
      // Fetch orders within the date range
      const ordersRes = await fetch(`${API_BASE}/orders/`);

      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch orders: ${ordersRes.status}`);
      }

      const allOrders = await ordersRes.json();

      // Filter orders by date range
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });

      // Fetch order items for all filtered orders
      const orderItemsRes = await fetch(`${API_BASE}/order-items/`);

      if (!orderItemsRes.ok) {
        throw new Error(`Failed to fetch order items: ${orderItemsRes.status}`);
      }

      const allOrderItems = await orderItemsRes.json();

      // Calculate ingredient usage
      const ingredientUsage = new Map();

      for (const order of filteredOrders) {
        // Get order items for this order
        const orderItems = allOrderItems.filter(item => item.order === order.id);

        for (const orderItem of orderItems) {
          // Get recipes for this menu item
          const recipes = recipeItems.filter(r => r.menu_item === orderItem.menu_item);

          for (const recipe of recipes) {
            // Calculate total usage (recipe quantity * order quantity)
            const totalUsage = recipe.quantity * orderItem.quantity;

            // Add to the map
            const currentUsage = ingredientUsage.get(recipe.ingredient) || 0;
            ingredientUsage.set(recipe.ingredient, currentUsage + totalUsage);
          }
        }
      }

      // Convert map to array for display
      const usageArray = Array.from(ingredientUsage.entries()).map(([ingredientName, quantity]) => {
        const ingredient = ingredients.find(i => i.name === ingredientName);
        return {
          ingredient: ingredientName,
          quantity: quantity.toFixed(2),
          unit: ingredient?.unit || 'N/A'
        };
      });

      // Sort by ingredient name
      usageArray.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

      setUsageData(usageArray);
      setHasCalculated(true);

      console.log('Product usage calculated:', {
        ordersFound: filteredOrders.length,
        ingredientsUsed: usageArray.length
      });

    } catch (error) {
      console.error('Failed to calculate usage:', error);
      alert(`Error calculating usage: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Product Usage Report</h2>
        <p className="text-gray-600 mb-4">
          Select a date range to see how much inventory was used during that period.
        </p>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block font-semibold mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex-1">
            <label className="block font-semibold mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button
            onClick={calculateUsage}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Usage'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-700 mt-4">Calculating usage...</p>
        </div>
      ) : hasCalculated ? (
        usageData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-100 border-b">
              <h3 className="font-bold text-lg">
                Usage from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Found {usageData.length} ingredient{usageData.length !== 1 ? 's' : ''} used
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold">Ingredient</th>
                  <th className="p-3 text-left font-semibold">Quantity Used</th>
                  <th className="p-3 text-left font-semibold">Unit</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">
                      {item.ingredient.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </td>
                    <td className="p-3 text-lg font-bold text-blue-600">
                      {item.quantity}
                    </td>
                    <td className="p-3 text-gray-600">
                      {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-700">No orders found in the selected date range.</p>
            <p className="text-sm text-gray-500 mt-2">Try selecting a different time period.</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-lg text-gray-700">Select a date range and click "Calculate Usage" to see results.</p>
        </div>
      )}
    </div>
  );
}

function SalesReportView({ menuItems }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateSales = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }

    setLoading(true);
    setHasCalculated(false);

    try {
      // Fetch orders within the date range
      const ordersRes = await fetch(`${API_BASE}/orders/`);

      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch orders: ${ordersRes.status}`);
      }

      const allOrders = await ordersRes.json();

      // Filter orders by date range
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });

      // Fetch order items for all orders
      const orderItemsRes = await fetch(`${API_BASE}/order-items/`);

      if (!orderItemsRes.ok) {
        throw new Error(`Failed to fetch order items: ${orderItemsRes.status}`);
      }

      const allOrderItems = await orderItemsRes.json();

      // Calculate sales by menu item
      const itemSales = new Map();

      for (const order of filteredOrders) {
        // Get order items for this order
        const orderItems = allOrderItems.filter(item => item.order === order.id);

        for (const orderItem of orderItems) {
          const menuItemId = orderItem.menu_item;
          const quantity = orderItem.quantity;
          const price = parseFloat(orderItem.price || 0);
          const totalRevenue = quantity * price;

          if (itemSales.has(menuItemId)) {
            const existing = itemSales.get(menuItemId);
            itemSales.set(menuItemId, {
              menuItemId,
              quantity: existing.quantity + quantity,
              revenue: existing.revenue + totalRevenue
            });
          } else {
            itemSales.set(menuItemId, {
              menuItemId,
              quantity,
              revenue: totalRevenue
            });
          }
        }
      }

      // Convert map to array and add menu item names
      const salesArray = Array.from(itemSales.values()).map(sale => {
        const menuItem = menuItems.find(m => m.id === sale.menuItemId);
        return {
          menuItemId: sale.menuItemId,
          menuItemName: menuItem?.name || 'Unknown Item',
          quantitySold: sale.quantity,
          totalRevenue: sale.revenue,
          averagePrice: sale.quantity > 0 ? sale.revenue / sale.quantity : 0
        };
      });

      // Sort by total revenue (highest first)
      salesArray.sort((a, b) => b.totalRevenue - a.totalRevenue);

      setSalesData(salesArray);
      setHasCalculated(true);

      console.log('Sales report calculated:', {
        ordersFound: filteredOrders.length,
        itemsFound: salesArray.length,
        totalRevenue: salesArray.reduce((sum, item) => sum + item.totalRevenue, 0)
      });

    } catch (error) {
      console.error('Failed to calculate sales:', error);
      alert(`Error calculating sales: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalQuantity = salesData.reduce((sum, item) => sum + item.quantitySold, 0);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Sales Report by Item</h2>
        <p className="text-gray-600 mb-4">
          Select a date range to see sales breakdown by menu item.
        </p>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block font-semibold mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex-1">
            <label className="block font-semibold mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button
            onClick={calculateSales}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {hasCalculated && salesData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Items Sold</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {totalQuantity}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Average Item Price</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {totalQuantity > 0 ? formatCurrency(totalRevenue / totalQuantity) : '$0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-700 mt-4">Calculating sales...</p>
        </div>
      ) : hasCalculated ? (
        salesData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-100 border-b">
              <h3 className="font-bold text-lg">
                Sales from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Found {salesData.length} menu item{salesData.length !== 1 ? 's' : ''} sold
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold">Menu Item</th>
                  <th className="p-3 text-right font-semibold">Quantity Sold</th>
                  <th className="p-3 text-right font-semibold">Avg Price</th>
                  <th className="p-3 text-right font-semibold">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">
                      {item.menuItemName}
                    </td>
                    <td className="p-3 text-right text-lg font-bold text-blue-600">
                      {item.quantitySold}
                    </td>
                    <td className="p-3 text-right text-gray-600">
                      {formatCurrency(item.averagePrice)}
                    </td>
                    <td className="p-3 text-right text-lg font-bold text-green-600">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-bold">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-right text-lg text-blue-600">
                    {totalQuantity}
                  </td>
                  <td className="p-3 text-right text-lg">
                    {totalQuantity > 0 ? formatCurrency(totalRevenue / totalQuantity) : '$0.00'}
                  </td>
                  <td className="p-3 text-right text-xl text-green-600">
                    {formatCurrency(totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-700">No sales found in the selected date range.</p>
            <p className="text-sm text-gray-500 mt-2">Try selecting a different time period.</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-lg text-gray-700">Select a date range and click "Generate Report" to see sales by item.</p>
        </div>
      )}
    </div>
  );
}

function XReportView() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    paymentMethods: {}
  });

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);

    try {
      // Fetch today's orders
      const ordersRes = await fetch(`${API_BASE}/orders/`);

      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch orders: ${ordersRes.status}`);
      }

      const allOrders = await ordersRes.json();

      // Get today's date range (midnight to current time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      // Filter orders for today only
      const todaysOrders = allOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= today && orderDate <= now;
      });

      console.log('Today\'s orders found:', todaysOrders.length);

      // Group orders by hour (0-23)
      const hourlyData = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlyData[hour] = {
          hour,
          sales: 0,
          transactions: 0,
          returns: 0,
          voids: 0,
          discards: 0,
          paymentMethods: {}
        };
      }

      let totalSales = 0;
      let totalTransactions = 0;
      const allPaymentMethods = {};

      // Process each order
      for (const order of todaysOrders) {
        const orderDate = new Date(order.order_date);
        const hour = orderDate.getHours();

        // Get the hourly bucket
        const hourData = hourlyData[hour];

        // Increment transaction count
        hourData.transactions++;
        totalTransactions++;

        // Add to sales total
        const orderTotal = parseFloat(order.total_price || 0);
        hourData.sales += orderTotal;
        totalSales += orderTotal;

        // Track payment method
        const paymentMethod = order.payment_method || 'Unknown';
        hourData.paymentMethods[paymentMethod] = (hourData.paymentMethods[paymentMethod] || 0) + 1;
        allPaymentMethods[paymentMethod] = (allPaymentMethods[paymentMethod] || 0) + 1;

        // Note: returns, voids, discards would need to be tracked in the order status/type field
        // For now, we're setting them to 0 as they're not in the current data model
      }

      // Convert to array and filter out hours with no activity
      const reportArray = Object.values(hourlyData);

      setReportData(reportArray);
      setSummary({
        totalSales,
        totalTransactions,
        paymentMethods: allPaymentMethods
      });
      setLastUpdated(new Date());

      console.log('X-Report generated:', {
        totalSales,
        totalTransactions,
        paymentMethods: allPaymentMethods
      });

    } catch (error) {
      console.error('Failed to generate X-Report:', error);
      alert(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">X-Report - Hourly Sales</h2>
            <p className="text-gray-600 mt-1">
              Current Day: {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Report'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a non-closing report (X-Report) that can be run multiple times throughout the day
            without affecting the register. It shows real-time sales activities broken down by hour.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && lastUpdated && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Sales</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(summary.totalSales)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Transactions</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {summary.totalTransactions}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Avg Transaction</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {summary.totalTransactions > 0
                ? formatCurrency(summary.totalSales / summary.totalTransactions)
                : '$0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Hourly Breakdown Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-700 mt-4">Generating report...</p>
        </div>
      ) : lastUpdated ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-100 border-b">
            <h3 className="font-bold text-lg">Hourly Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold">Hour</th>
                  <th className="p-3 text-right font-semibold">Sales</th>
                  <th className="p-3 text-right font-semibold">Transactions</th>
                  <th className="p-3 text-right font-semibold">Avg Sale</th>
                  <th className="p-3 text-left font-semibold">Payment Methods</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((hourData) => {
                  const hasActivity = hourData.transactions > 0;
                  const avgSale = hasActivity ? hourData.sales / hourData.transactions : 0;

                  // Only show hours with activity
                  if (!hasActivity) return null;

                  return (
                    <tr key={hourData.hour} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">
                        {formatHour(hourData.hour)}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        {formatCurrency(hourData.sales)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {hourData.transactions}
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        {formatCurrency(avgSale)}
                      </td>
                      <td className="p-3">
                        {Object.entries(hourData.paymentMethods).map(([method, count]) => (
                          <span key={method} className="inline-block mr-2 text-sm">
                            <span className="font-semibold">{method}:</span> {count}
                          </span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-bold">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-right text-green-600 text-lg">
                    {formatCurrency(summary.totalSales)}
                  </td>
                  <td className="p-3 text-right text-lg">
                    {summary.totalTransactions}
                  </td>
                  <td className="p-3 text-right text-lg">
                    {summary.totalTransactions > 0
                      ? formatCurrency(summary.totalSales / summary.totalTransactions)
                      : '$0.00'}
                  </td>
                  <td className="p-3">
                    {Object.entries(summary.paymentMethods).map(([method, count]) => (
                      <span key={method} className="inline-block mr-2 text-sm">
                        <span className="font-semibold">{method}:</span> {count}
                      </span>
                    ))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-lg text-gray-700">Click "Refresh Report" to generate the X-Report.</p>
        </div>
      )}

      {/* Payment Methods Summary */}
      {!loading && lastUpdated && Object.keys(summary.paymentMethods).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">Payment Methods Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.paymentMethods).map(([method, count]) => (
              <div key={method} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 uppercase font-semibold">{method}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((count / summary.totalTransactions) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ZReportView() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canRunReport, setCanRunReport] = useState(true);
  const [lastReportDate, setLastReportDate] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    checkIfCanRun();
  }, []);

  const checkIfCanRun = () => {
    // Check if Z-report was already run today
    const lastRun = localStorage.getItem('lastZReportDate');
    if (lastRun) {
      const lastRunDate = new Date(lastRun);
      const today = new Date();

      // Check if it's the same day
      if (lastRunDate.toDateString() === today.toDateString()) {
        setCanRunReport(false);
        setLastReportDate(lastRunDate);
      } else {
        setCanRunReport(true);
        setLastReportDate(null);
      }
    }
  };

  const confirmAndGenerate = () => {
    if (!canRunReport) {
      alert('Z-Report has already been run today. It can only be run once per day.');
      return;
    }
    setShowConfirmDialog(true);
  };

  const generateReport = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      // Fetch today's orders
      const ordersRes = await fetch(`${API_BASE}/orders/`);
      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch orders: ${ordersRes.status}`);
      }
      const allOrders = await ordersRes.json();

      // Get today's date range (midnight to now)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      // Filter orders for today
      const todaysOrders = allOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= today && orderDate <= now;
      });

      // Calculate comprehensive totals
      let totalSales = 0;
      let totalTax = 0;
      let totalServiceCharge = 0;
      let totalDiscounts = 0;
      let totalVoids = 0;
      let grossSales = 0;
      const paymentMethods = {};
      const employeeTransactions = {};

      for (const order of todaysOrders) {
        const orderTotal = parseFloat(order.total_price || 0);
        const basePrice = parseFloat(order.base_price || orderTotal / 1.0825); // Assuming 8.25% tax
        const tax = orderTotal - basePrice;
        const serviceCharge = basePrice * 0.18; // 18% service charge

        grossSales += basePrice;
        totalTax += tax;
        totalServiceCharge += serviceCharge;
        totalSales += orderTotal;

        // Track payment methods
        const paymentMethod = order.payment_method || 'Unknown';
        paymentMethods[paymentMethod] = (paymentMethods[paymentMethod] || 0) + orderTotal;

        // Track employee (if available)
        if (order.employee_name) {
          if (!employeeTransactions[order.employee_name]) {
            employeeTransactions[order.employee_name] = {
              count: 0,
              total: 0
            };
          }
          employeeTransactions[order.employee_name].count++;
          employeeTransactions[order.employee_name].total += orderTotal;
        }
      }

      const netSales = totalSales - totalDiscounts - totalVoids;

      const report = {
        date: now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: now.toLocaleTimeString(),
        totalTransactions: todaysOrders.length,
        grossSales,
        totalTax,
        totalServiceCharge,
        totalDiscounts,
        totalVoids,
        netSales,
        paymentMethods,
        employeeTransactions
      };

      setReportData(report);

      // Mark Z-report as run for today
      localStorage.setItem('lastZReportDate', now.toISOString());
      setCanRunReport(false);
      setLastReportDate(now);

      console.log('Z-Report generated:', report);

      // In a real system, you would call an API endpoint here to:
      // 1. Store the Z-report in the database
      // 2. Reset daily counters
      // 3. Mark the day as closed

    } catch (error) {
      console.error('Failed to generate Z-Report:', error);
      alert(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">!</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-red-900 mb-2">Z-Report (End of Day)</h2>
            <div className="space-y-2 text-red-800">
              <p className="font-semibold">⚠️ WARNING: This is a CLOSING report with permanent side effects!</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Can only be run ONCE per day</li>
                <li>Finalizes all daily transactions</li>
                <li>Resets daily counters to zero</li>
                <li>Marks the business day as closed</li>
                <li>Cannot be undone</li>
              </ul>
              <p className="font-semibold mt-3">Only run this report at the end of the business day when you will have no more transactions!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className={`bg-white rounded-lg shadow-md p-6 ${!canRunReport ? 'border-2 border-red-500' : ''}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Report Status</h3>
            {canRunReport ? (
              <p className="text-green-600 font-semibold mt-1">✓ Z-Report can be generated</p>
            ) : (
              <div className="mt-2">
                <p className="text-red-600 font-bold">✗ Z-Report already run today</p>
                <p className="text-sm text-gray-600 mt-1">
                  Last run: {lastReportDate?.toLocaleString()}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  You can run the next Z-Report tomorrow after midnight.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={confirmAndGenerate}
            disabled={!canRunReport || loading}
            className={`px-6 py-3 font-bold rounded-md transition-colors ${canRunReport && !loading
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {loading ? 'Generating...' : 'Generate Z-Report'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">Confirm Z-Report Generation</h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">Are you sure you want to generate the Z-Report?</p>
              <div className="bg-red-50 border border-red-300 rounded p-3">
                <p className="text-sm text-red-800 font-semibold">This action will:</p>
                <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                  <li>Close the business day</li>
                  <li>Reset all daily counters</li>
                  <li>Cannot be run again until tomorrow</li>
                  <li>Cannot be undone</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateReport}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
              >
                Yes, Generate Report
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Display */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-lg text-gray-700 mt-4">Generating end-of-day report...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-3xl font-bold text-red-900">Z-REPORT</h2>
              <p className="text-xl font-semibold mt-2">{reportData.date}</p>
              <p className="text-gray-600">Closed at: {reportData.time}</p>
            </div>

            {/* Sales Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-3 border-b pb-2">Sales Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span className="font-mono">{formatCurrency(reportData.grossSales)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discounts:</span>
                    <span className="font-mono">-{formatCurrency(reportData.totalDiscounts)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Voids:</span>
                    <span className="font-mono">-{formatCurrency(reportData.totalVoids)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Net Sales:</span>
                    <span className="font-mono">{formatCurrency(reportData.netSales)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 border-b pb-2">Tax & Charges</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service Charge (18%):</span>
                    <span className="font-mono">{formatCurrency(reportData.totalServiceCharge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax (8.25%):</span>
                    <span className="font-mono">{formatCurrency(reportData.totalTax)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-green-600">
                    <span>Total Revenue:</span>
                    <span className="font-mono text-xl">{formatCurrency(reportData.netSales)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Count */}
            <div className="bg-blue-50 rounded p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Transactions:</span>
                <span className="text-3xl font-bold text-blue-600">{reportData.totalTransactions}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Payment Methods</h3>
            <div className="space-y-3">
              {Object.entries(reportData.paymentMethods).map(([method, amount]) => (
                <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-semibold">{method}</span>
                  <span className="font-mono text-lg">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Breakdown */}
          {Object.keys(reportData.employeeTransactions).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">Employee Activity</h3>
              <div className="space-y-3">
                {Object.entries(reportData.employeeTransactions).map(([employee, data]) => (
                  <div key={employee} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">{employee}</p>
                      <p className="text-sm text-gray-600">{data.count} transactions</p>
                    </div>
                    <span className="font-mono text-lg">{formatCurrency(data.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closing Notice */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
            <p className="text-green-900 font-bold text-lg">✓ Business Day Closed Successfully</p>
            <p className="text-green-700 mt-2">Daily counters have been reset. See you tomorrow!</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-lg text-gray-700">Click "Generate Z-Report" to close the business day.</p>
          <p className="text-sm text-gray-500 mt-2">Make sure all transactions for today are complete!</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DIALOG COMPONENTS - ADD
// ============================================================================

function AddMenuItemDialog({ onClose, onSuccess, ingredients, menuCategories }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || !category || !price) {
      alert('Please fill in all fields');
      return;
    }

    if (selectedIngredients.length === 0) {
      alert('Please add at least one ingredient to the recipe');
      return;
    }

    for (const ing of selectedIngredients) {
      if (!ing.ingredient_id || !ing.quantity || parseFloat(ing.quantity) <= 0) {
        alert('All ingredients must have a valid quantity');
        return;
      }
    }

    try {
      // Create menu item
      const menuRes = await fetch(`${API_BASE}/menu-items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category: parseInt(category),
          base_price: parseFloat(price)
        })
      });

      if (!menuRes.ok) {
        const error = await menuRes.json();
        throw new Error(JSON.stringify(error));
      }

      const savedItem = await menuRes.json();

      // Create recipe items
      for (const ing of selectedIngredients) {
        await fetch(`${API_BASE}/recipe-items/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_item: savedItem.id,
            ingredient: parseInt(ing.ingredient_id),
            quantity: parseFloat(ing.quantity)
          })
        });
      }

      alert(`✓ Successfully added menu item: ${name}`);
      onSuccess();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Add New Menu Item</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., Classic Milk Tea"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Category</option>
              {menuCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="4.99"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Recipe Ingredients *</h3>
              <button
                onClick={addIngredient}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {selectedIngredients.map((ing, idx) => {
              const ingredient = ingredients.find(i => i.id === parseInt(ing.ingredient_id));
              return (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select
                    value={ing.ingredient_id}
                    onChange={(e) => updateIngredient(idx, 'ingredient_id', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded"
                  >
                    <option value="">Select Ingredient</option>
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({i.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    className="w-24 px-3 py-2 border rounded"
                    placeholder="Qty"
                  />
                  <span className="w-12 text-sm">{ingredient?.unit || 'unit'}</span>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              <Check size={20} />
              Add Menu Item
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddIngredientDialog({ onClose, onSuccess, units }) {
  const [name, setName] = useState('');
  const [stockLevel, setStockLevel] = useState('');
  const [unit, setUnit] = useState('');
  const [threshold, setThreshold] = useState('');

  const handleSubmit = async () => {
    if (!name || !stockLevel || !unit || !threshold) {
      alert('Please fill in all fields');
      return;
    }

    // Convert to snake_case
    const snakeCaseName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      const res = await fetch(`${API_BASE}/ingredients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: snakeCaseName,
          stock_level: parseFloat(stockLevel),
          unit: parseInt(unit),
          low_stock_threshold: parseFloat(threshold)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
      }

      alert(`✓ Successfully added ingredient: ${name} (saved as ${snakeCaseName})`);
      onSuccess();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Add New Ingredient</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-100 border border-blue-300 rounded p-3 text-sm">
            <strong>Note:</strong> Ingredient names will be converted to snake_case (e.g., "Brown Sugar" → "brown_sugar")
          </div>

          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., Brown Sugar"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Stock Level *</label>
            <input
              type="number"
              step="0.01"
              value={stockLevel}
              onChange={(e) => setStockLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="100.0"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Low Stock Threshold *</label>
            <input
              type="number"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="10.0"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              <Check size={20} />
              Add Ingredient
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEmployeeDialog({ onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('');

  const handleSubmit = async () => {
    if (!firstName || !lastName || !position || !hireDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          position,
          hire_date: hireDate
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
      }

      alert(`✓ Successfully added employee: ${firstName} ${lastName}`);
      onSuccess();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Add New Employee</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block font-semibold mb-1">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Position *</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., Cashier"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Hire Date *</label>
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              <Check size={20} />
              Add Employee
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DIALOG COMPONENTS - EDIT
// ============================================================================

function EditMenuItemDialog({ item, onClose, onSuccess, ingredients, menuCategories, recipeItems }) {
  // Find category ID from name
  const categoryId = menuCategories.find(c => c.name === item.category)?.id || '';

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(categoryId);
  const [price, setPrice] = useState(item.base_price);

  // Load existing recipe
  const existingRecipes = recipeItems.filter(r => r.menu_item === item.id);
  const ingredientNameToId = new Map(ingredients.map(i => [i.name, i.id]));

  const [selectedIngredients, setSelectedIngredients] = useState(
    existingRecipes.map(r => ({
      ingredient_id: ingredientNameToId.get(r.ingredient) || '',
      quantity: r.quantity
    }))
  );

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const handleSubmit = async () => {
    if (!name || !category || !price) {
      alert('Please fill in all fields');
      return;
    }

    if (selectedIngredients.length === 0) {
      alert('Please add at least one ingredient to the recipe');
      return;
    }

    for (const ing of selectedIngredients) {
      if (!ing.ingredient_id || !ing.quantity || parseFloat(ing.quantity) <= 0) {
        alert('All ingredients must have a valid quantity');
        return;
      }
    }

    try {
      // Update menu item
      const menuRes = await fetch(`${API_BASE}/menu-items/${item.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category: parseInt(category),
          base_price: parseFloat(price)
        })
      });

      if (!menuRes.ok) {
        const error = await menuRes.json();
        throw new Error(JSON.stringify(error));
      }

      // Delete old recipes
      for (const recipe of existingRecipes) {
        await fetch(`${API_BASE}/recipe-items/${recipe.id}/`, { method: 'DELETE' });
      }

      // Create new recipes
      for (const ing of selectedIngredients) {
        await fetch(`${API_BASE}/recipe-items/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_item: item.id,
            ingredient: parseInt(ing.ingredient_id),
            quantity: parseFloat(ing.quantity)
          })
        });
      }

      alert(`✓ Successfully updated menu item: ${name}`);
      onSuccess();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Edit Menu Item: {item.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Category</option>
              {menuCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Recipe Ingredients *</h3>
              <button
                onClick={addIngredient}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {selectedIngredients.map((ing, idx) => {
              const ingredient = ingredients.find(i => i.id === parseInt(ing.ingredient_id));
              return (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select
                    value={ing.ingredient_id}
                    onChange={(e) => updateIngredient(idx, 'ingredient_id', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded"
                  >
                    <option value="">Select Ingredient</option>
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({i.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    className="w-24 px-3 py-2 border rounded"
                    placeholder="Qty"
                  />
                  <span className="w-12 text-sm">{ingredient?.unit || 'unit'}</span>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              <Check size={20} />
              Update Menu Item
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditIngredientDialog({ item, onClose, onSuccess, units }) {
  // Find unit ID from abbreviation
  const unitId = units.find(u => u.abbreviation === item.unit)?.id || '';

  const [stockLevel, setStockLevel] = useState(item.stock_level);
  const [unit, setUnit] = useState(unitId);
  const [threshold, setThreshold] = useState(item.low_stock_threshold);

  const handleSubmit = async () => {
    if (!stockLevel || !unit || !threshold) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/ingredients/${item.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name, // Name doesn't change
          stock_level: parseFloat(stockLevel),
          unit: parseInt(unit),
          low_stock_threshold: parseFloat(threshold)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
      }

      alert(`✓ Successfully updated ingredient`);
      onSuccess();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Ingredient</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input
              type="text"
              value={item.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-100"
            />
            <p className="text-sm text-gray-600 mt-1">Name cannot be changed</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Stock Level *</label>
            <input
              type="number"
              step="0.01"
              value={stockLevel}
              onChange={(e) => setStockLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Low Stock Threshold *</label>
            <input
              type="number"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              <Check size={20} />
              Update Ingredient
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditEmployeeDialog({ item, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState(item.first_name);
  const [lastName, setLastName] = useState(item.last_name);
  const [position, setPosition] = useState(item.position);
  const [hireDate, setHireDate] = useState(item.hire_date);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !position || !hireDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/employees/${item.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          position,
          hire_date: hireDate
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
      }

      alert(`✓ Successfully updated employee: ${firstName} ${lastName}`);
      onSuccess();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Employee</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block font-semibold mb-1">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Position *</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Hire Date *</label>
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              <Check size={20} />
              Update Employee
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BobaManager;
