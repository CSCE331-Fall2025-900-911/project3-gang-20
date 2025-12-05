/*
  File: boba_manager.jsx
  Description: Professional Manager Dashboard mimicking ManagerController.java logic.
  Features:
  - Strict Tax/Service Charge calculation parity with Java backend.
  - Client-side data processing for complex reports (X/Z Reports, Product Usage, Sales).
  - "Smooth" CRUD operations with dedicated Recipe Editor.
  - Sortable columns & Robust Category Matching.
  - UPDATED: Fixed Order History Date Logic (Uses Local Timezone explicitly to fix "Missing Today" bug).
*/

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Coffee, 
  Package, 
  Users, 
  FileText, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign, 
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ClipboardList
} from 'lucide-react';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const API_BASE = 'https://project3-gang-20-810838872032.us-south1.run.app/api';

// Logic Constants from ManagerController.java
const TAX_RATE = 0.0825;
const SERVICE_CHARGE_RATE = 0.025;

// ============================================================================
// UTILITIES & HOOKS
// ============================================================================

const formatCurrency = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

// Helper to get YYYY-MM-DD in LOCAL time (not UTC)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Hook for sorting tabular data.
 * Usage: const { items, requestSort, sortConfig } = useSortableData(data);
 */
const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nulls
        if (aValue === null) aValue = "";
        if (bValue === null) bValue = "";

        // Number comparison
        if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue)) && typeof aValue !== 'string') {
           // allow standard sort for numbers
        } else {
            // String comparison case-insensitive
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BobaManager({ onBack }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('menu'); // menu, inventory, employees, reports, orders, void
  
  // Data State
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Loading State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initial Data Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [menuRes, ingRes, empRes, recRes, catRes, unitRes] = await Promise.all([
        fetch(`${API_BASE}/menu-items/`),
        fetch(`${API_BASE}/ingredients/`),
        fetch(`${API_BASE}/employees/`),
        fetch(`${API_BASE}/recipe-items/`),
        fetch(`${API_BASE}/menu-categories/`),
        fetch(`${API_BASE}/units/`)
      ]);

      if (!menuRes.ok || !ingRes.ok) throw new Error("Failed to fetch core data");

      setMenuItems(await menuRes.json());
      setIngredients(await ingRes.json());
      setEmployees(await empRes.json());
      setRecipes(await recRes.json());
      setCategories(await catRes.json());
      setUnits(await unitRes.json());
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <MenuManager data={{ menuItems, ingredients, recipes, categories }} onRefresh={refreshData} />;
      case 'inventory': return <InventoryManager data={{ ingredients, units }} onRefresh={refreshData} />;
      case 'employees': return <EmployeeManager data={{ employees }} onRefresh={refreshData} />;
      // FIX: Pass categories to reports so we can resolve ID -> Name
      case 'reports': return <ReportsDashboard data={{ menuItems, ingredients, recipes, employees, categories }} />;
      case 'orders': return <OrdersHistoryView />;
      case 'void': return <VoidOrderManager onRefresh={refreshData} />;
      default: return <div className="p-8">Select a tab</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Manager</h1>
            <p className="text-xs text-slate-400">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton icon={Coffee} label="Menu Items" id="menu" active={activeTab} onClick={setActiveTab} />
          <NavButton icon={Package} label="Inventory" id="inventory" active={activeTab} onClick={setActiveTab} />
          <NavButton icon={Users} label="Employees" id="employees" active={activeTab} onClick={setActiveTab} />
          <NavButton icon={ClipboardList} label="Order History" id="orders" active={activeTab} onClick={setActiveTab} />
          <NavButton icon={TrendingUp} label="Reports" id="reports" active={activeTab} onClick={setActiveTab} />
          <NavButton icon={AlertTriangle} label="Void Order" id="void" active={activeTab} onClick={setActiveTab} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onBack} className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut size={20} />
            <span>Exit</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Syncing Data...</span>
            </div>
          )}
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-auto p-8 relative">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: SHARED UI
// ============================================================================

function NavButton({ icon: Icon, label, id, active, onClick }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md translate-x-1' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );
}

function SortableHeader({ label, sortKey, sortConfig, requestSort, align = "left" }) {
  const isActive = sortConfig && sortConfig.key === sortKey;
  return (
    <th 
      className={`p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none text-${align}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
        {label}
        {isActive ? (
          sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        ) : (
          <ArrowUpDown size={14} className="opacity-30" />
        )}
      </div>
    </th>
  );
}

// ============================================================================
// SUB-COMPONENTS: MENU MANAGEMENT
// ============================================================================

function MenuManager({ data, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Use the sorting hook
  const { items: sortedItems, requestSort, sortConfig } = useSortableData(data.menuItems, { key: 'name', direction: 'ascending' });

  const handleEdit = (item) => {
    // Reconstruct recipe for this item
    const itemRecipe = data.recipes.filter(r => r.menu_item === item.id);
    setEditingItem({ ...item, recipe: itemRecipe });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will remove the item and its recipe.")) return;
    try {
      await fetch(`${API_BASE}/menu-items/${id}/`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      alert("Failed to delete item.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-slate-500">Managing {data.menuItems.length} items</div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> Add Menu Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
              <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Category" sortKey="category" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Price" sortKey="base_price" sortConfig={sortConfig} requestSort={requestSort} />
              <th className="p-4 font-semibold">Recipe Count</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedItems.map(item => {
              const recipeCount = data.recipes.filter(r => r.menu_item === item.id).length;
              
              // FIX: Handle both String Names and ID references for Category
              let categoryName = 'Unknown';
              
              if (item.category) {
                // If it looks like a number, try to look it up by ID
                if (!isNaN(parseFloat(item.category)) && isFinite(item.category)) {
                   const foundCat = data.categories.find(c => c.id == item.category);
                   if (foundCat) categoryName = foundCat.name;
                } else {
                   // Otherwise, assume the API returned the string name directly
                   categoryName = item.category;
                }
              }
              
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{item.name}</td>
                  <td className="p-4 text-slate-600">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                      {categoryName}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-mono">{formatCurrency(item.base_price)}</td>
                  <td className="p-4 text-slate-500 text-sm">{recipeCount} ingredients</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <MenuModal 
          item={editingItem} 
          data={data} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); onRefresh(); }} 
        />
      )}
    </div>
  );
}

function MenuModal({ item, data, onClose, onSuccess }) {
  // FIX: Resolve category Name to ID for the select dropdown
  const getInitialCategoryId = () => {
    if (!item?.category) return '';
    
    // Case 1: item.category is already an ID (e.g., 1)
    if (data.categories.some(c => c.id == item.category)) {
      return item.category;
    }
    
    // Case 2: item.category is a Name (e.g. "Milk Tea") -> Find the ID
    const foundCat = data.categories.find(c => c.name === item.category);
    return foundCat ? foundCat.id : '';
  };

  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: getInitialCategoryId(),
    base_price: item?.base_price || '',
  });
  
  // FIX: Detect if API provided Name or ID, and map to ID for dropdown compatibility
  const [recipeList, setRecipeList] = useState(
    item?.recipe ? item.recipe.map(r => {
      // 1. Try finding by ID (normal case)
      let ing = data.ingredients.find(i => i.id === r.ingredient);
      
      // 2. Fallback: If 'r.ingredient' is a name (e.g. "Brown Sugar"), look up the ID
      if (!ing) {
        ing = data.ingredients.find(i => i.name === r.ingredient);
      }

      return {
        // Use the resolved ingredient ID so the <select> value matches an <option>
        ingredient_id: ing ? ing.id : '', 
        quantity: r.quantity,
        unit: ing?.unit || ''
      };
    }) : []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Save Menu Item
      const url = item ? `${API_BASE}/menu-items/${item.id}/` : `${API_BASE}/menu-items/`;
      const method = item ? 'PUT' : 'POST';
      
      const menuRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!menuRes.ok) throw new Error("Failed to save menu item");
      
      const savedItem = await menuRes.json();
      const itemId = savedItem.id;

      // 2. Handle Recipe (Delete old if editing, then Add new)
      if (item) {
        // Find original recipe items to delete. In a real app, maybe do a diff.
        // Here we delete all old recipe lines for this item and re-add.
        const oldRecipes = data.recipes.filter(r => r.menu_item === item.id);
        await Promise.all(oldRecipes.map(r => 
          fetch(`${API_BASE}/recipe-items/${r.id}/`, { method: 'DELETE' })
        ));
      }

      // 3. Add new recipe lines
      await Promise.all(recipeList.map(r => 
        fetch(`${API_BASE}/recipe-items/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_item: itemId,
            ingredient: r.ingredient_id, // FIX: Don't use parseInt, IDs might be strings
            quantity: parseFloat(r.quantity)
          })
        })
      ));

      onSuccess();
    } catch (err) {
      alert("Error saving item: " + err.message);
    }
  };

  const addIngredientRow = () => {
    setRecipeList([...recipeList, { ingredient_id: '', quantity: 1, unit: '' }]);
  };

  const removeIngredientRow = (idx) => {
    const newList = [...recipeList];
    newList.splice(idx, 1);
    setRecipeList(newList);
  };

  const updateIngredientRow = (idx, field, value) => {
    const newList = [...recipeList];
    newList[idx][field] = value;
    if (field === 'ingredient_id') {
      const ing = data.ingredients.find(i => i.id == value); // Loose equality for finding
      newList[idx].unit = ing ? ing.unit : '';
    }
    setRecipeList(newList);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">{item ? 'Edit Menu Item' : 'New Menu Item'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Item Name</label>
              <input 
                required 
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Price ($)</label>
              <input 
                required type="number" step="0.01"
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.base_price}
                onChange={e => setFormData({...formData, base_price: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Category</label>
            <select 
              required
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select Category...</option>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Recipe Editor */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700">Recipe Configuration</label>
              <button type="button" onClick={addIngredientRow} className="text-xs bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1 rounded flex items-center gap-1">
                <Plus size={12} /> Add Ingredient
              </button>
            </div>
            
            <div className="space-y-2">
              {recipeList.length === 0 && <div className="text-center text-slate-400 text-sm py-4 italic">No ingredients added yet.</div>}
              {recipeList.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select 
                    required
                    className="flex-1 p-2 text-sm border border-slate-300 rounded"
                    value={row.ingredient_id}
                    onChange={e => updateIngredientRow(idx, 'ingredient_id', e.target.value)}
                  >
                    <option value="">Select Ingredient...</option>
                    {data.ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <input 
                    required type="number" step="0.01" min="0.01"
                    className="w-20 p-2 text-sm border border-slate-300 rounded"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={e => updateIngredientRow(idx, 'quantity', e.target.value)}
                  />
                  <span className="w-12 text-xs text-slate-500 font-medium">{row.unit || '-'}</span>
                  <button type="button" onClick={() => removeIngredientRow(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium shadow-sm flex items-center gap-2">
            <Save size={18} /> Save Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: INVENTORY & EMPLOYEES
// ============================================================================

function InventoryManager({ data, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Logic to highlight low stock
  // FIX: Force numeric conversion to avoid string comparison errors ("1000" < "20")
  const isLowStock = (item) => {
    const stock = parseFloat(item.stock_level);
    const threshold = parseFloat(item.low_stock_threshold);
    return !isNaN(stock) && !isNaN(threshold) && stock < threshold;
  };
  
  // Create a separate list for Low Stock items
  const lowStockItems = data.ingredients.filter(isLowStock);
  
  // Use sorting hook for the main table
  const { items: sortedIngredients, requestSort, sortConfig } = useSortableData(data.ingredients, { key: 'name', direction: 'ascending' });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the ingredient.")) return;
    try {
      await fetch(`${API_BASE}/ingredients/${id}/`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      alert("Failed to delete ingredient. It may be used in recipes.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-slate-500">Managing {data.ingredients.length} items</div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18}/> Add Ingredient
        </button>
      </div>

      {/* NEW: Dedicated Low Stock Dashboard */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Critical Stock Alerts</h3>
              <p className="text-sm text-red-700">Action required: {lowStockItems.length} items are strictly below their threshold.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-red-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-red-100 text-red-900 text-xs uppercase font-bold">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Threshold</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {lowStockItems.map(item => (
                  <tr key={item.id} className="hover:bg-red-50">
                    <td className="p-3 font-bold text-slate-800">{item.name}</td>
                    <td className="p-3 font-mono font-bold text-red-600">{item.stock_level}</td>
                    <td className="p-3 font-mono text-slate-500">{item.low_stock_threshold}</td>
                    <td className="p-3 text-slate-500">{item.unit}</td>
                    <td className="p-3 text-right">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Restock Now</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
          All Inventory Items
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
            <tr>
              <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Stock" sortKey="stock_level" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Unit" sortKey="unit" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Threshold" sortKey="low_stock_threshold" sortConfig={sortConfig} requestSort={requestSort} />
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedIngredients.map(item => (
              <tr key={item.id} className={isLowStock(item) ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"}>
                <td className="p-4 font-medium">{item.name}</td>
                <td className={`p-4 font-bold ${isLowStock(item) ? "text-red-600" : "text-green-600"}`}>{item.stock_level}</td>
                <td className="p-4 text-slate-500">{item.unit}</td>
                <td className="p-4 text-slate-500">{item.low_stock_threshold}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(item)} className="text-blue-600 p-2"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 p-2"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <InventoryModal 
          item={editingItem} 
          units={data.units}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); onRefresh(); }} 
        />
      )}
    </div>
  );
}

function InventoryModal({ item, units, onClose, onSuccess }) {
  // Try to find the matching unit ID from the string representation if editing
  const initialUnitId = useMemo(() => {
    if (!item?.unit) return '';
    // If unit is already an ID (unlikely given ReadSerializer), return it
    if (!isNaN(parseFloat(item.unit))) return item.unit;
    // Otherwise match by abbreviation or name
    const found = units.find(u => u.abbreviation === item.unit || u.name === item.unit);
    return found ? found.id : '';
  }, [item, units]);

  const [formData, setFormData] = useState({
    name: item?.name || '',
    stock_level: item?.stock_level || '',
    unit: initialUnitId,
    low_stock_threshold: item?.low_stock_threshold || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = item ? `${API_BASE}/ingredients/${item.id}/` : `${API_BASE}/ingredients/`;
      const method = item ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to save ingredient");
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">{item ? 'Edit Ingredient' : 'New Ingredient'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Name</label>
            <input 
              required 
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Stock Level</label>
              <input 
                required type="number" step="0.01"
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.stock_level}
                onChange={e => setFormData({...formData, stock_level: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Unit</label>
              <select 
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
              >
                <option value="">Select Unit...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Low Stock Threshold</label>
            <input 
              required type="number" step="0.01"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.low_stock_threshold}
              onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium shadow-sm flex items-center gap-2">
              <Save size={18} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeManager({ data, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Use sorting hook
  const { items: sortedEmployees, requestSort, sortConfig } = useSortableData(data.employees, { key: 'first_name', direction: 'ascending' });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the employee record.")) return;
    try {
      await fetch(`${API_BASE}/employees/${id}/`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      alert("Failed to delete employee.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-slate-500">Managing Employees</div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18}/> Add Employee
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
            <tr>
              <SortableHeader label="First Name" sortKey="first_name" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Last Name" sortKey="last_name" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Position" sortKey="position" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Hire Date" sortKey="hire_date" sortConfig={sortConfig} requestSort={requestSort} />
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium">{emp.first_name}</td>
                <td className="p-4 font-medium">{emp.last_name}</td>
                <td className="p-4 text-slate-600">{emp.position}</td>
                <td className="p-4 text-slate-500">{formatDate(emp.hire_date)}</td>
                <td className="p-4 text-right">
                   <button onClick={() => handleEdit(emp)} className="text-blue-600 p-2"><Edit size={16}/></button>
                   <button onClick={() => handleDelete(emp.id)} className="text-red-600 p-2"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <EmployeeModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); onRefresh(); }} 
        />
      )}
    </div>
  );
}

function EmployeeModal({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: item?.first_name || '',
    last_name: item?.last_name || '',
    position: item?.position || '',
    hire_date: item?.hire_date || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = item ? `${API_BASE}/employees/${item.id}/` : `${API_BASE}/employees/`;
      const method = item ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to save employee");
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">{item ? 'Edit Employee' : 'New Employee'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">First Name</label>
              <input 
                required 
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Last Name</label>
              <input 
                required 
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Position</label>
            <input 
              required 
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.position}
              onChange={e => setFormData({...formData, position: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Hire Date</label>
            <input 
              required type="date"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.hire_date}
              onChange={e => setFormData({...formData, hire_date: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium shadow-sm flex items-center gap-2">
              <Save size={18} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: REPORTS
// ============================================================================

function ReportsDashboard({ data }) {
  const [reportType, setReportType] = useState('x-report'); // sales, product, x-report, z-report
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setReportResult(null);
    try {
      // 1. Fetch Orders and OrderItems
      const [ordersRes, orderItemsRes] = await Promise.all([
        fetch(`${API_BASE}/orders/`),
        fetch(`${API_BASE}/order-items/`)
      ]);
      const orders = await ordersRes.json();
      const orderItems = await orderItemsRes.json();

      let processedData = null;

      // 2. Route to logic based on type
      if (reportType === 'x-report') {
        processedData = generateXReport(orders, orderItems, data.menuItems);
      } else if (reportType === 'z-report') {
        processedData = generateZReport(orders, orderItems, data.menuItems);
      } else if (reportType === 'sales') {
        // FIX: Pass all required data to sales report
        processedData = generateSalesReport(orders, orderItems, data.menuItems, data.categories, dateRange);
      } else if (reportType === 'product') {
        processedData = generateProductUsage(orders, orderItems, data.recipes, dateRange);
      } else if (reportType === 'low-stock') {
        // FIX: Also force numeric conversion in reports
        processedData = data.ingredients.filter(i => {
           const stock = parseFloat(i.stock_level);
           const threshold = parseFloat(i.low_stock_threshold);
           return !isNaN(stock) && !isNaN(threshold) && stock < threshold;
        });
      }

      setReportResult(processedData);
    } catch (e) {
      alert("Failed to generate report: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- REPORT LOGIC IMPLEMENTATION (Matches ManagerController.java) ---

  const generateXReport = (orders, orderItems, menuItems) => {
    // Filter for TODAY
    const todayStr = getLocalDateString();
    const todaysOrders = orders.filter(o => {
        const orderDateStr = getLocalDateString(new Date(o.order_date_time));
        return orderDateStr === todayStr;
    });

    // Buckets for hours 0-23
    const hours = Array(24).fill(0).map((_, i) => ({
      hour: i, orders: 0, gross: 0, cash: 0, card: 0, voids: 0
    }));

    todaysOrders.forEach(o => {
      const hour = new Date(o.order_date_time).getHours();
      const hData = hours[hour];
      
      const total = parseFloat(o.total_price);
      // NOTE: ManagerController.java Logic:
      // "total_orders" counts ALL orders, even voids.
      hData.orders += 1; 

      if (o.payment_method === 'VOID') {
        hData.voids += total;
      } else {
        hData.gross += total;
        if (o.payment_method === 'Cash') hData.cash += total;
        else hData.card += total;
      }
    });

    return { type: 'x-report', rows: hours.filter(h => h.orders > 0), totals: calculateTotals(hours) };
  };

  const generateZReport = (orders, orderItems, menuItems) => {
    const todayStr = getLocalDateString();
    const todaysOrders = orders.filter(o => {
        const orderDateStr = getLocalDateString(new Date(o.order_date_time));
        return orderDateStr === todayStr;
    });

    let totalSalesPreTax = 0;
    let cardSalesPreTax = 0;
    let voidTotalValue = 0;
    let cashCount = 0;
    let cardCount = 0;
    let voidCount = 0;

    todaysOrders.forEach(o => {
      // Re-calculate pre-tax from total (Reverse engineering tax: Total = Pre * (1+Rate))
      const total = parseFloat(o.total_price);
      const preTax = total / (1 + TAX_RATE);

      if (o.payment_method === 'VOID') {
        voidCount++;
        voidTotalValue += total;
      } else {
        totalSalesPreTax += preTax;
        if (o.payment_method === 'Cash') cashCount++;
        else if (o.payment_method === 'Card') {
          cardCount++;
          cardSalesPreTax += preTax;
        }
      }
    });

    const totalTax = totalSalesPreTax * TAX_RATE;
    const serviceCharge = cardSalesPreTax * SERVICE_CHARGE_RATE;

    return {
      type: 'z-report',
      data: {
        totalSalesPreTax,
        totalTax,
        grossSales: totalSalesPreTax + totalTax,
        cashCount, cardCount, voidCount,
        voidTotalValue,
        serviceCharge
      }
    };
  };

  const generateSalesReport = (orders, orderItems, menuItems, categories, dates) => {
    // UPDATED: Strict local date string comparison
    const validOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date_time);
      
      // Parse inputs as local parts
      const [sy, sm, sd] = dates.start.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      
      const [ey, em, ed] = dates.end.split('-').map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      
      return orderDate >= start && orderDate <= end && o.payment_method !== 'VOID';
    });

    const salesMap = {}; // MenuItemID -> { name, quantity, revenue }

    validOrders.forEach(order => {
      const items = orderItems.filter(oi => oi.order === order.id);
      items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menu_item);
        if (!menuItem) return;
        
        if (!salesMap[item.menu_item]) {
          // Resolve Category Name safely
          let catName = menuItem.category || 'Uncategorized';
          if (!isNaN(parseFloat(catName)) && isFinite(catName)) {
             const c = categories.find(cat => cat.id == catName);
             if (c) catName = c.name;
          }

          salesMap[item.menu_item] = { 
            name: menuItem.name, 
            category: catName,
            quantity: 0, 
            revenue: 0 
          };
        }
        
        // Java logic uses base price for item sales report
        const price = parseFloat(menuItem.base_price);
        salesMap[item.menu_item].quantity += item.quantity;
        salesMap[item.menu_item].revenue += (item.quantity * price);
      });
    });

    const salesList = Object.values(salesMap).sort((a, b) => b.revenue - a.revenue);
    return { type: 'sales', data: salesList, period: { start: dates.start, end: dates.end } };
  };

  const generateProductUsage = (orders, orderItems, recipes, dates) => {
    // UPDATED: Strict local date string comparison
    const validOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date_time);
      
      const [sy, sm, sd] = dates.start.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      
      const [ey, em, ed] = dates.end.split('-').map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      
      return orderDate >= start && orderDate <= end && o.payment_method !== 'VOID';
    });

    const usageMap = {}; // IngredientID -> Qty

    validOrders.forEach(order => {
      const items = orderItems.filter(oi => oi.order === order.id);
      items.forEach(item => {
        // Find recipe for this menu item
        const itemRecipes = recipes.filter(r => r.menu_item === item.menu_item);
        itemRecipes.forEach(r => {
          const totalUsed = r.quantity * item.quantity;
          usageMap[r.ingredient] = (usageMap[r.ingredient] || 0) + totalUsed;
        });
      });
    });

    return { type: 'product', data: usageMap };
  };

  // ------------------------------------------------------------------

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Report Type</label>
          <select 
            className="p-2 border border-slate-300 rounded min-w-[200px]"
            value={reportType} onChange={e => setReportType(e.target.value)}
          >
            <option value="x-report">X-Report (Hourly)</option>
            <option value="z-report">Z-Report (End of Day)</option>
            <option value="sales">Sales Report</option>
            <option value="product">Product Usage</option>
            <option value="low-stock">Low Stock Alert</option>
          </select>
        </div>
        
        {['sales', 'product'].includes(reportType) && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Start Date</label>
              <input type="date" className="p-2 border border-slate-300 rounded" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">End Date</label>
              <input type="date" className="p-2 border border-slate-300 rounded" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
            </div>
          </>
        )}

        <button 
          onClick={generateReport}
          disabled={loading}
          className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? "Processing..." : "Generate Report"}
        </button>
      </div>

      {/* Results View */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto p-6">
        {!reportResult ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FileText size={48} className="mb-4 opacity-50" />
            <p>Select parameters and generate a report to view results.</p>
          </div>
        ) : (
          <ReportViewer type={reportType} result={reportResult} meta={data} />
        )}
      </div>
    </div>
  );
}

function ReportViewer({ type, result, meta }) {
  if (type === 'x-report') {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold border-b pb-4">X-Report: Hourly Breakdown</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-3">Hour</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Gross Sales</th>
              <th className="p-3">Cash</th>
              <th className="p-3">Card</th>
              <th className="p-3">Voids</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map(r => (
              <tr key={r.hour} className="border-b border-slate-50">
                <td className="p-3 font-medium">{r.hour}:00 - {r.hour}:59</td>
                <td className="p-3">{r.orders}</td>
                <td className="p-3 font-mono">{formatCurrency(r.gross)}</td>
                <td className="p-3 font-mono text-green-600">{formatCurrency(r.cash)}</td>
                <td className="p-3 font-mono text-blue-600">{formatCurrency(r.card)}</td>
                <td className="p-3 font-mono text-red-600">{formatCurrency(r.voids)}</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td className="p-3">TOTAL</td>
              <td className="p-3">{result.totals.orders}</td>
              <td className="p-3">{formatCurrency(result.totals.gross)}</td>
              <td className="p-3">{formatCurrency(result.totals.cash)}</td>
              <td className="p-3">{formatCurrency(result.totals.card)}</td>
              <td className="p-3">{formatCurrency(result.totals.voids)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'z-report') {
    const { data } = result;
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Z-REPORT</h2>
          <p className="text-slate-500">{new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="space-y-2">
           <ReportRow label="Total Sales (Pre-Tax)" value={data.totalSalesPreTax} />
           <ReportRow label={`Total Tax (${(TAX_RATE*100).toFixed(2)}%)`} value={data.totalTax} />
           <div className="border-t border-slate-300 my-2"></div>
           <ReportRow label="GROSS SALES (Incl Tax)" value={data.grossSales} bold />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <ReportRow label="Cash Orders Count" value={data.cashCount} isCurrency={false} />
          <ReportRow label="Card Orders Count" value={data.cardCount} isCurrency={false} />
          <ReportRow label="Void Orders Count" value={data.voidCount} isCurrency={false} />
        </div>

        <div className="space-y-2">
           <ReportRow label="Service Charges Collected" value={data.serviceCharge} />
           <ReportRow label="Total Void Value" value={data.voidTotalValue} color="text-red-600" />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 text-center text-sm text-yellow-800 rounded">
          <strong>Note:</strong> Z-Report marks the end of day. Ensure all orders are finalized.
        </div>
      </div>
    );
  }

  if (type === 'sales') {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold border-b pb-4">Sales Report ({formatDate(result.period.start)} - {formatDate(result.period.end)})</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-50">
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 text-slate-500">{row.category}</td>
                <td className="p-3 text-right">{row.quantity}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'product') {
    return (
      <table className="w-full text-left">
        <thead className="bg-slate-50"><tr><th className="p-3">Ingredient</th><th className="p-3">Quantity Used</th></tr></thead>
        <tbody>
          {Object.entries(result.data).map(([id, qty]) => {
            const ing = meta.ingredients.find(i => i.id === parseInt(id));
            return (
              <tr key={id} className="border-b">
                <td className="p-3">{ing ? ing.name : `ID: ${id}`}</td>
                <td className="p-3 font-mono">{qty.toFixed(2)} {ing?.unit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (type === 'low-stock') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-600 border-b pb-4">
           <AlertTriangle />
           <h3 className="text-xl font-bold">Low Stock Alert</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-red-50 text-red-900 uppercase text-xs">
            <tr>
              <th className="p-3">Ingredient</th>
              <th className="p-3">Current Stock</th>
              <th className="p-3">Threshold</th>
              <th className="p-3">Unit</th>
            </tr>
          </thead>
          <tbody>
            {result.map(item => (
              <tr key={item.id} className="border-b border-red-50 hover:bg-red-50">
                <td className="p-3 font-medium text-slate-800">{item.name}</td>
                <td className="p-3 font-bold text-red-600">{item.stock_level}</td>
                <td className="p-3 text-slate-500">{item.low_stock_threshold}</td>
                <td className="p-3 text-slate-500">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div>Report view not implemented for this type yet.</div>;
}

function ReportRow({ label, value, bold, isCurrency = true, color = "text-slate-800" }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-bold text-lg' : 'text-sm'}`}>
      <span className="text-slate-600">{label}</span>
      <span className={`font-mono ${color}`}>{isCurrency ? formatCurrency(value) : value}</span>
    </div>
  );
}

function calculateTotals(rows) {
  return rows.reduce((acc, r) => ({
    orders: acc.orders + r.orders,
    gross: acc.gross + r.gross,
    cash: acc.cash + r.cash,
    card: acc.card + r.card,
    voids: acc.voids + r.voids
  }), { orders: 0, gross: 0, cash: 0, card: 0, voids: 0 });
}

// ============================================================================
// SUB-COMPONENTS: ORDER HISTORY
// ============================================================================

function OrdersHistoryView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('week'); // 'week', 'month', 'custom'
  
  // FIX: Initialize with local time to avoid "yesterday's date" default
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return {
      start: getLocalDateString(start),
      end: getLocalDateString(end)
    };
  });

  // Use sorting hook for the table
  const { items: sortedOrders, requestSort, sortConfig } = useSortableData(orders, { key: 'order_date_time', direction: 'descending' });

  useEffect(() => {
    fetchOrders();
  }, [dateRange]); // Fetch when range changes

  const setQuickRange = (type) => {
    const end = new Date();
    const start = new Date();
    if (type === 'week') start.setDate(end.getDate() - 7);
    if (type === 'month') start.setMonth(end.getMonth() - 1);
    
    setDateRange({
      start: getLocalDateString(start),
      end: getLocalDateString(end)
    });
    setFilter(type);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/orders/`);
        const all = await res.json();
        
        // Client side filtering with LOCAL Time logic
        const filtered = all.filter(o => {
            const orderDate = new Date(o.order_date_time);
            
            // Construct start date (Local 00:00:00)
            const [sy, sm, sd] = dateRange.start.split('-').map(Number);
            const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
            
            // Construct end date (Local 23:59:59.999)
            const [ey, em, ed] = dateRange.end.split('-').map(Number);
            const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
            
            return orderDate >= start && orderDate <= end;
        });
        setOrders(filtered);
    } catch(e) {
        alert("Error fetching orders");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex gap-2">
            <button 
              onClick={() => setQuickRange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Past Week
            </button>
            <button 
              onClick={() => setQuickRange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Past Month
            </button>
          </div>
          
          <div className="flex gap-4 items-center flex-1">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 mb-1">Start Date</label>
              <input 
                type="date" 
                className="border p-2 rounded text-sm"
                value={dateRange.start}
                onChange={(e) => {
                  setFilter('custom');
                  setDateRange({ ...dateRange, start: e.target.value });
                }}
              />
            </div>
            <span className="text-slate-400 mt-4">to</span>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 mb-1">End Date</label>
              <input 
                type="date" 
                className="border p-2 rounded text-sm"
                value={dateRange.end}
                onChange={(e) => {
                  setFilter('custom');
                  setDateRange({ ...dateRange, end: e.target.value });
                }}
              />
            </div>
          </div>

          <button 
            onClick={fetchOrders}
            disabled={loading}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Loading..." : "Refresh List"}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-600 flex justify-between">
          <span>Orders ({sortedOrders.length})</span>
          <span className="text-sm font-normal text-slate-500">
            Total Value: {formatCurrency(sortedOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0))}
          </span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
            <tr>
              <SortableHeader label="Order ID" sortKey="id" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Date & Time" sortKey="order_date_time" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Employee" sortKey="employee" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Payment" sortKey="payment_type" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Total" sortKey="total_price" sortConfig={sortConfig} requestSort={requestSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">No orders found for this period.</td>
              </tr>
            ) : (
              sortedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-slate-600">#{order.id}</td>
                  <td className="p-4 text-slate-800">{formatDateTime(order.order_date_time)}</td>
                  <td className="p-4 text-slate-600">{order.employee || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      order.payment_type === 'VOID' ? 'bg-red-100 text-red-700' : 
                      order.payment_type === 'Card' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {order.payment_type}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-medium">{formatCurrency(order.total_price)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: VOID ORDER
// ============================================================================

function VoidOrderManager({ onRefresh }) {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/orders/`);
      const allOrders = await res.json();
      const found = allOrders.find(o => o.id === parseInt(orderId));
      
      if (!found) {
        setError(`Order #${orderId} not found.`);
        setOrderData(null);
      } else {
        setError(null);
        setOrderData(found);
      }
    } catch (err) {
      setError("Error fetching orders.");
    }
  };

  const handleVoid = async () => {
    if (!window.confirm(`Void Order #${orderData.id}? This cannot be undone.`)) return;
    
    // NOTE: In a real API, we'd PATCH. Assuming full PUT required or specific endpoint.
    // Simulating Java logic: UPDATE orders SET payment_type = 'VOID'
    try {
      const updatedOrder = { ...orderData, payment_method: 'VOID' };
      // Depending on API, might need PUT /orders/:id
      const res = await fetch(`${API_BASE}/orders/${orderData.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });
      
      if (res.ok) {
        alert("Order Voided Successfully.");
        setOrderData(null);
        setOrderId('');
        onRefresh();
      } else {
        alert("Failed to update order.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Void Transaction</h2>
        <p className="text-slate-500 mb-8">Enter the Order ID to void a transaction. This will remove it from net sales.</p>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input 
            className="flex-1 border p-3 rounded-lg text-lg text-center font-mono tracking-widest"
            placeholder="ORDER ID"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
          />
          <button className="bg-slate-800 text-white p-3 rounded-lg"><Search /></button>
        </form>

        {error && <p className="text-red-500 font-medium">{error}</p>}

        {orderData && (
          <div className="bg-slate-50 p-4 rounded-lg text-left border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Date:</span>
              <span className="font-medium">{formatDateTime(orderData.order_date_time)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Current Status:</span>
              <span className={`font-bold ${orderData.payment_method === 'VOID' ? 'text-red-600' : 'text-green-600'}`}>
                {orderData.payment_method}
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-slate-500">Total:</span>
              <span className="font-bold text-lg">{formatCurrency(orderData.total_price)}</span>
            </div>

            {orderData.payment_method !== 'VOID' ? (
              <button onClick={handleVoid} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow transition-colors">
                CONFIRM VOID
              </button>
            ) : (
              <div className="text-center text-red-500 font-bold p-2 border-2 border-red-200 rounded">
                ALREADY VOIDED
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}