/*
  File: boba_manager.jsx
  Description: Professional Manager Dashboard styled to match Kiosk wireframes.
  Features:
  - Layout: Top Navigation Bar with Tab-like buttons.
  - Visuals: Warm Amber/Cream theme.
  - Logic: Full parity with previous state.
  - Fixes: 
    - Removed horizontal scrollbar from nav tabs.
    - "Manager Dashboard" text strictly centered.
    - Optimized Loading: Granular data fetching.
    - Added Loading Buffer and Pointer Cursors.
    - Fixed Centering Issue: Uses mx-auto for reliable full-screen centering.
    - Fixed JSX Syntax Error.
    - UPDATED: Fixed "Crunched to left" issue by ensuring full width containers.
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ClipboardList,
  Home,
  Loader2
} from 'lucide-react';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const API_BASE = 'https://project3-gang-20-810838872032.us-south1.run.app/api';

const TAX_RATE = 0.0825;
const SERVICE_CHARGE_RATE = 0.025;

const COLORS = {
  bgGradient: 'from-[#fffbeb] to-[#fed7aa]', // Cream to Light Orange
  text: '#78350f',       // Dark Brown
  textSecondary: '#92400e', // Medium Brown
  primary: '#d97706',    // Amber
  primaryHover: '#b45309',
  cardBg: 'white',
  danger: '#dc2626',
  success: '#16a34a',
};

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

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null) aValue = "";
        if (bValue === null) bValue = "";

        if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue)) && typeof aValue !== 'string') {
           // number sort
        } else {
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
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
  const [activeTab, setActiveTab] = useState('menu');
  
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- OPTIMIZED DATA FETCHING ---
  const fetchMenuData = useCallback(async () => {
    const [menuRes, recipesRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE}/menu-items/`),
      fetch(`${API_BASE}/recipe-items/`),
      fetch(`${API_BASE}/menu-categories/`)
    ]);
    if (!menuRes.ok) throw new Error("Failed to fetch menu");
    setMenuItems(await menuRes.json());
    setRecipes(await recipesRes.json());
    setCategories(await categoriesRes.json());
  }, []);

  const fetchInventoryData = useCallback(async () => {
    const [ingRes, unitsRes] = await Promise.all([
      fetch(`${API_BASE}/ingredients/`),
      fetch(`${API_BASE}/units/`)
    ]);
    if (!ingRes.ok) throw new Error("Failed to fetch inventory");
    setIngredients(await ingRes.json());
    setUnits(await unitsRes.json());
  }, []);

  const fetchEmployeeData = useCallback(async () => {
    const empRes = await fetch(`${API_BASE}/employees/`);
    if (!empRes.ok) throw new Error("Failed to fetch employees");
    setEmployees(await empRes.json());
  }, []);

  // Initial Load - Fetches everything
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchMenuData(), fetchInventoryData(), fetchEmployeeData()]);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data. Please check connection.");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [fetchMenuData, fetchInventoryData, fetchEmployeeData]);

  // Specific refreshers used by sub-components for speedier updates
  const refreshMenu = async () => { setLoading(true); await fetchMenuData(); setLoading(false); };
  const refreshInventory = async () => { setLoading(true); await fetchInventoryData(); setLoading(false); };
  const refreshEmployees = async () => { setLoading(true); await fetchEmployeeData(); setLoading(false); };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <MenuManager data={{ menuItems, ingredients, recipes, categories }} onRefresh={refreshMenu} />;
      case 'inventory': return <InventoryManager data={{ ingredients, units }} onRefresh={refreshInventory} />;
      case 'employees': return <EmployeeManager data={{ employees }} onRefresh={refreshEmployees} />;
      case 'reports': return <ReportsDashboard data={{ menuItems, ingredients, recipes, employees, categories }} />;
      case 'orders': return <OrdersHistoryView />;
      case 'void': return <VoidOrderManager onRefresh={() => {}} />; 
      default: return <div className="p-8 text-center text-[#92400e]">Select a tab</div>;
    }
  };

  return (
    <div className={`h-screen bg-gradient-to-br ${COLORS.bgGradient} font-sans text-[#78350f] flex flex-col overflow-hidden`}>
      {/* Custom CSS for Scrollbars */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #fed7aa;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d97706;
        }
      `}</style>

      {/* Top Navigation Bar - UPDATED: w-full without max-width constraint */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[#fed7aa] px-6 py-4 flex-shrink-0 shadow-sm z-20 w-full">
        <div className="w-full flex flex-col gap-6">
          
          {/* Header Row - STRICTLY CENTERED */}
          <div className="w-full flex justify-center items-center relative">
             <h1 className="text-3xl font-bold text-[#78350f] tracking-tight text-center">
               Manager Dashboard
             </h1>
          </div>

          {/* Tabs Row - Centered and Enlarged */}
          <nav className="flex gap-4 overflow-x-auto hide-scrollbar justify-center items-center w-full pb-1">
            <NavTab label="Overview" id="menu" active={activeTab} onClick={setActiveTab} />
            <NavTab label="Employees" id="employees" active={activeTab} onClick={setActiveTab} />
            <NavTab label="Inventory" id="inventory" active={activeTab} onClick={setActiveTab} />
            <NavTab label="Reports" id="reports" active={activeTab} onClick={setActiveTab} />
            <NavTab label="Orders" id="orders" active={activeTab} onClick={setActiveTab} />
            <NavTab label="Void" id="void" active={activeTab} onClick={setActiveTab} />
          </nav>
        </div>
      </div>

      {/* Main Content Area - UPDATED: w-full, flex-grow, and centered content */}
      <main className="flex-1 overflow-y-auto p-6 w-full scroll-smooth relative custom-scrollbar flex flex-col items-center">
        {/* Content Container - UPDATED: Increased max-width and ensured w-full */}
        <div className="w-full max-w-[1600px] h-full flex flex-col mb-20">
          {loading && (
            <div className="flex items-center justify-center gap-3 text-[#d97706] mb-6 bg-white/50 py-2 px-4 rounded-full w-fit mx-auto shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm font-bold">Updating...</span>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertTriangle className="text-red-500 shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="w-full flex-1 flex flex-col">
              {renderContent()}
          </div>
        </div>

        {/* Return Home Button - Fixed Bottom Left */}
        <button 
          onClick={onBack} 
          className="fixed top-6 left-6 flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#fde68a] hover:bg-[#fcd34d] text-[#92400e] font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 border-2 border-[#d97706]/20 z-50 text-lg cursor-pointer"
        >
          <Home size={24} /> Return Home
        </button>
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: SHARED UI
// ============================================================================

function NavTab({ label, id, active, onClick }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        px-10 py-4 rounded-2xl font-bold text-lg transition-all border-2 whitespace-nowrap flex-shrink-0 cursor-pointer
        ${isActive 
          ? `bg-[#e5e5e5] border-[#a3a3a3] text-black shadow-inner transform scale-105` 
          : `bg-[#f5f5f5] border-transparent text-gray-500 hover:bg-[#e5e5e5] hover:text-gray-700 hover:shadow-md`}
      `}
    >
      {label}
    </button>
  );
}

function SortableHeader({ label, sortKey, sortConfig, requestSort, align = "left" }) {
  const isActive = sortConfig && sortConfig.key === sortKey;
  const alignmentClass = align === "center" ? "justify-center" : (align === "right" ? "justify-end" : "justify-start");
  const textAlignClass = align === "center" ? "text-center" : (align === "right" ? "text-right" : "text-left");

  return (
    <th 
      className={`p-4 font-bold text-[#78350f] cursor-pointer hover:bg-[#fffbeb] transition-colors select-none ${textAlignClass} border-b border-[#fed7aa] bg-white sticky top-0 z-10 whitespace-nowrap`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${alignmentClass}`}>
        {label}
        {isActive ? (
          sortConfig.direction === 'ascending' ? <ArrowUp size={14} className="text-[#d97706]" /> : <ArrowDown size={14} className="text-[#d97706]" />
        ) : (
          <ArrowUpDown size={14} className="opacity-30 text-[#92400e]" />
        )}
      </div>
    </th>
  );
}

function ActionButton({ onClick, icon: Icon, label, variant = 'primary', disabled = false, className="" }) {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap cursor-pointer";
  const variants = {
    primary: "bg-[#ea580c] text-white hover:bg-[#c2410c] border border-transparent", 
    secondary: "bg-white text-[#78350f] border border-[#d97706] hover:bg-[#fffbeb]",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
    success: "bg-[#16a34a] text-white hover:bg-green-700 border border-transparent",
    update: "bg-[#e5e7eb] text-black border border-[#9ca3af] hover:bg-[#d1d5db] uppercase text-xs tracking-wider px-3 py-1 shadow-sm"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: MENU MANAGEMENT
// ============================================================================

function MenuManager({ data, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { items: sortedItems, requestSort, sortConfig } = useSortableData(data.menuItems, { key: 'name', direction: 'ascending' });

  const handleEdit = (item) => {
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
    <div className="space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-[#fed7aa] w-full">
         <div>
             <h2 className="text-xl font-bold text-[#78350f]">Menu Items</h2>
             <p className="text-xs text-[#92400e] opacity-80">Manage drink offerings and prices</p>
         </div>
         <ActionButton onClick={() => { setEditingItem(null); setIsModalOpen(true); }} icon={Plus} label="ADD NEW ITEM" variant="primary" />
      </div>

      <Card className="flex-1 flex flex-col min-h-0 w-full">
        <div className="overflow-auto flex-1 custom-scrollbar w-full">
            <table className="w-full text-left border-collapse relative">
            <thead>
                <tr className="bg-[#fffbeb]">
                <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Category" sortKey="category" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <SortableHeader label="Price" sortKey="base_price" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <th className="p-4 font-bold text-[#78350f] text-center border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb] z-10">Recipe</th>
                <th className="p-4 font-bold text-[#78350f] text-center border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb] z-10">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#fed7aa]">
                {sortedItems.map(item => {
                const recipeCount = data.recipes.filter(r => r.menu_item === item.id).length;
                let categoryName = 'Unknown';
                if (item.category) {
                    if (!isNaN(parseFloat(item.category)) && isFinite(item.category)) {
                    const foundCat = data.categories.find(c => c.id == item.category);
                    if (foundCat) categoryName = foundCat.name;
                    } else {
                    categoryName = item.category;
                    }
                }
                
                return (
                    <tr key={item.id} className="hover:bg-[#fffbeb] transition-colors text-[#78350f]">
                    <td className="p-4 font-bold text-base truncate max-w-[240px]">{item.name}</td>
                    <td className="p-4 text-center">
                        <span className="bg-[#fed7aa] text-[#78350f] px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border border-[#d97706] whitespace-nowrap">
                        {categoryName}
                        </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-center">{formatCurrency(item.base_price)}</td>
                    <td className="p-4 text-sm font-medium opacity-80 text-center">
                        <span className={`${recipeCount > 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {recipeCount} ingredients
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                            <ActionButton onClick={() => handleEdit(item)} label="UPDATE" variant="update" />
                            <button 
                                onClick={() => handleDelete(item.id)} 
                                className="text-red-500 hover:text-red-700 p-1 rounded transition-colors cursor-pointer"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </Card>

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
  const getInitialCategoryId = () => {
    if (!item?.category) return '';
    if (data.categories.some(c => c.id == item.category)) return item.category;
    const foundCat = data.categories.find(c => c.name === item.category);
    return foundCat ? foundCat.id : '';
  };

  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: getInitialCategoryId(),
    base_price: item?.base_price || '',
  });
  
  const [recipeList, setRecipeList] = useState(
    item?.recipe ? item.recipe.map(r => {
      let ing = data.ingredients.find(i => i.id === r.ingredient);
      if (!ing) ing = data.ingredients.find(i => i.name === r.ingredient);
      return { ingredient_id: ing ? ing.id : '', quantity: r.quantity, unit: ing?.unit || '' };
    }) : []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = item ? `${API_BASE}/menu-items/${item.id}/` : `${API_BASE}/menu-items/`;
      const method = item ? 'PUT' : 'POST';
      const menuRes = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!menuRes.ok) throw new Error("Failed to save menu item");
      const savedItem = await menuRes.json();
      const itemId = savedItem.id;

      if (item) {
        const oldRecipes = data.recipes.filter(r => r.menu_item === item.id);
        await Promise.all(oldRecipes.map(r => fetch(`${API_BASE}/recipe-items/${r.id}/`, { method: 'DELETE' })));
      }

      await Promise.all(recipeList.map(r => fetch(`${API_BASE}/recipe-items/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menu_item: itemId, ingredient: r.ingredient_id, quantity: parseFloat(r.quantity) }) })));
      onSuccess();
    } catch (err) { alert("Error saving item: " + err.message); }
  };

  const updateIngredientRow = (idx, field, value) => {
    const newList = [...recipeList];
    newList[idx][field] = value;
    if (field === 'ingredient_id') {
      const ing = data.ingredients.find(i => i.id == value);
      newList[idx].unit = ing ? ing.unit : '';
    }
    setRecipeList(newList);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-[#d97706]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-lg font-bold text-black font-mono">{item ? 'Edit Menu Item' : 'New Menu Item'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white custom-scrollbar">
          {/* Row 1: Name and Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Item Name</label>
              <input required className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Price ($)</label>
              <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.base_price} onChange={e => setFormData({...formData, base_price: parseFloat(e.target.value)})} />
            </div>
          </div>
          
          {/* Row 2: Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Category</label>
            <select required className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">Select Category...</option>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Row 3: Recipe Config Header */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                <label className="block text-xs font-bold text-[#78350f] font-mono uppercase">Recipe Configuration</label>
                <button type="button" onClick={() => setRecipeList([...recipeList, { ingredient_id: '', quantity: 1, unit: '' }])} className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1 rounded hover:bg-gray-50 flex items-center gap-1 cursor-pointer">
                    + Add Ingredient
                </button>
            </div>
            
            <div className="space-y-2">
              {recipeList.length === 0 && (
                 <div className="text-center py-4 text-gray-400 text-sm italic">
                    No ingredients. Add one to start.
                 </div>
              )}
              {recipeList.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select required className="flex-1 p-2 text-sm border border-gray-300 rounded bg-white font-mono" value={row.ingredient_id} onChange={e => updateIngredientRow(idx, 'ingredient_id', e.target.value)}>
                    <option value="">Select Ingredient...</option>
                    {data.ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <div className="flex items-center border border-gray-300 rounded bg-white">
                     <input required type="number" step="0.0001" className="w-20 p-2 text-sm text-right font-mono outline-none border-r border-gray-200" placeholder="Qty" value={row.quantity} onChange={e => updateIngredientRow(idx, 'quantity', e.target.value)} />
                     <span className="w-10 text-[10px] text-gray-400 font-mono text-center px-1 truncate">{row.unit || '-'}</span>
                  </div>
                  <button type="button" onClick={() => { const nl = [...recipeList]; nl.splice(idx, 1); setRecipeList(nl); }} className="text-red-400 hover:text-red-600 p-1 cursor-pointer"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-10 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-mono text-sm cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-[#4f46e5] text-white hover:bg-[#4338ca] rounded shadow-sm flex items-center gap-2 font-mono text-sm cursor-pointer">
             <Save size={14} /> Save Item
          </button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: INVENTORY & EMPLOYEES
// ============================================================================

function InventoryManager({ data, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const isLowStock = (item) => parseFloat(item.stock_level) < parseFloat(item.low_stock_threshold);
  const lowStockItems = data.ingredients.filter(isLowStock);
  const { items: sortedIngredients, requestSort, sortConfig } = useSortableData(data.ingredients, { key: 'name', direction: 'ascending' });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try { await fetch(`${API_BASE}/ingredients/${id}/`, { method: 'DELETE' }); onRefresh(); } catch (e) { alert("Failed."); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col w-full">
      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-[#fed7aa]">
         <div>
             <h2 className="text-xl font-bold text-[#78350f]">Inventory</h2>
             <p className="text-xs text-[#92400e] opacity-80">Track stock levels</p>
         </div>
        <ActionButton onClick={() => { setEditingItem(null); setIsModalOpen(true); }} icon={Plus} label="ADD INGREDIENT" variant="primary" />
      </div>

      {lowStockItems.length > 0 && (
        <Card className="bg-red-50 border-red-200 p-4 shadow-sm shrink-0 w-full">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-bold text-red-900 text-sm">Critical Stock Alerts ({lowStockItems.length})</h3>
          </div>
          <div className="max-h-32 overflow-y-auto border border-red-200 rounded bg-white custom-scrollbar">
             <table className="w-full text-left text-sm">
               <thead className="bg-red-50 text-red-800 sticky top-0"><tr><th className="p-2">Item</th><th className="p-2">Stock</th><th className="p-2">Limit</th></tr></thead>
               <tbody>{lowStockItems.map(i => <tr key={i.id} className="border-b border-red-100 text-xs"><td className="p-2">{i.name}</td><td className="p-2 font-bold text-red-600">{i.stock_level}</td><td className="p-2 text-gray-500">{i.low_stock_threshold}</td></tr>)}</tbody>
             </table>
          </div>
        </Card>
      )}

      <Card className="flex-1 flex flex-col min-h-0 w-full">
        <div className="overflow-auto flex-1 custom-scrollbar w-full">
            <table className="w-full text-left border-collapse relative">
            <thead>
                <tr className="bg-[#fffbeb]">
                <SortableHeader label="Item Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Stock" sortKey="stock_level" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <SortableHeader label="Unit" sortKey="unit" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <SortableHeader label="Threshold" sortKey="low_stock_threshold" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <th className="p-4 text-center text-[#78350f] font-bold border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb] z-10">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#fed7aa]">
                {sortedIngredients.map(item => (
                <tr key={item.id} className={`${isLowStock(item) ? "bg-red-50 hover:bg-red-100" : "hover:bg-[#fffbeb]"} transition-colors text-[#78350f]`}>
                    <td className="p-4 font-bold truncate max-w-[200px]">{item.name}</td>
                    <td className={`p-4 font-bold font-mono text-base text-center ${isLowStock(item) ? "text-red-600" : "text-[#16a34a]"}`}>{item.stock_level}</td>
                    <td className="p-4 opacity-80 font-medium text-center">{item.unit}</td>
                    <td className="p-4 opacity-80 font-mono text-center">{item.low_stock_threshold}</td>
                    <td className="p-4 text-center">
                    <div className="flex justify-center gap-2 items-center">
                        <ActionButton onClick={() => { setEditingItem(item); setIsModalOpen(true); }} label="UPDATE" variant="update" />
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={18}/></button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </Card>

      {isModalOpen && <InventoryModal item={editingItem} units={data.units} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); onRefresh(); }} />}
    </div>
  );
}

function InventoryModal({ item, units, onClose, onSuccess }) {
  const initialUnitId = useMemo(() => {
    if (!item?.unit) return '';
    if (!isNaN(parseFloat(item.unit))) return item.unit;
    const found = units.find(u => u.abbreviation === item.unit || u.name === item.unit);
    return found ? found.id : '';
  }, [item, units]);

  const [formData, setFormData] = useState({ name: item?.name || '', stock_level: item?.stock_level || '', unit: initialUnitId, low_stock_threshold: item?.low_stock_threshold || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = item ? `${API_BASE}/ingredients/${item.id}/` : `${API_BASE}/ingredients/`;
      const method = item ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Failed");
      onSuccess();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-black font-mono">{item ? 'Edit Ingredient' : 'New Ingredient'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Name</label>
            <input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Stock</label>
              <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.stock_level} onChange={e => setFormData({...formData, stock_level: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Unit</label>
              <select required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                <option value="">Select...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Threshold</label>
            <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <ActionButton onClick={onClose} label="Cancel" variant="secondary" className="text-sm" />
            <ActionButton onClick={handleSubmit} label="Save" icon={Save} className="text-sm" />
          </div>
        </form>
      </Card>
    </div>
  );
}

function EmployeeManager({ data, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { items: sortedEmployees, requestSort, sortConfig } = useSortableData(data.employees, { key: 'first_name', direction: 'ascending' });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try { await fetch(`${API_BASE}/employees/${id}/`, { method: 'DELETE' }); onRefresh(); } catch (e) { alert("Failed."); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col w-full">
      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-[#fed7aa]">
         <div>
             <h2 className="text-xl font-bold text-[#78350f]">Employees</h2>
             <p className="text-xs text-[#92400e] opacity-80">Manage staff records</p>
         </div>
        <ActionButton onClick={() => { setEditingItem(null); setIsModalOpen(true); }} icon={Plus} label="ADD EMPLOYEE" variant="primary" />
      </div>
      
      <Card className="flex-1 flex flex-col min-h-0 w-full">
        <div className="overflow-auto flex-1 custom-scrollbar w-full">
            <table className="w-full text-left border-collapse relative">
            <thead>
                <tr className="bg-[#fffbeb]">
                <SortableHeader label="First Name" sortKey="first_name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Last Name" sortKey="last_name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Position" sortKey="position" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <SortableHeader label="Hire Date" sortKey="hire_date" sortConfig={sortConfig} requestSort={requestSort} align="center" />
                <th className="p-4 text-center text-[#78350f] font-bold border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb] z-10">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#fed7aa]">
                {sortedEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-[#fffbeb] transition-colors text-[#78350f]">
                    <td className="p-4 font-bold truncate max-w-[150px]">{emp.first_name}</td>
                    <td className="p-4 font-bold truncate max-w-[150px]">{emp.last_name}</td>
                    <td className="p-4 text-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase border border-gray-200">
                            {emp.position}
                        </span>
                    </td>
                    <td className="p-4 opacity-80 font-mono text-sm text-center">{formatDate(emp.hire_date)}</td>
                    <td className="p-4 text-center">
                    <div className="flex justify-center gap-2 items-center">
                        <ActionButton onClick={() => { setEditingItem(emp); setIsModalOpen(true); }} label="UPDATE" variant="update" />
                        <button onClick={() => handleDelete(emp.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={18}/></button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </Card>
      {isModalOpen && <EmployeeModal item={editingItem} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); onRefresh(); }} />}
    </div>
  );
}

function EmployeeModal({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ first_name: item?.first_name || '', last_name: item?.last_name || '', position: item?.position || '', hire_date: item?.hire_date || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = item ? `${API_BASE}/employees/${item.id}/` : `${API_BASE}/employees/`;
      const method = item ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Failed");
      onSuccess();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-black font-mono">{item ? 'Edit Employee' : 'New Employee'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">First Name</label><input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Last Name</label><input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Position</label><input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Hire Date</label><input required type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} /></div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100"><ActionButton onClick={onClose} label="Cancel" variant="secondary" className="text-sm" /><ActionButton onClick={handleSubmit} label="Save" icon={Save} className="text-sm" /></div>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: REPORTS
// ============================================================================

function ReportsDashboard({ data }) {
  const [reportType, setReportType] = useState(null); // No default, forces user selection
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportType) generateReport(reportType);
  }, [reportType]);

  const handleReportClick = (type) => {
    setReportType(type);
  };

  const generateReport = async (type) => {
    setLoading(true); setReportResult(null);
    try {
      const [ordersRes, orderItemsRes] = await Promise.all([fetch(`${API_BASE}/orders/`), fetch(`${API_BASE}/order-items/`)]);
      const orders = await ordersRes.json(); const orderItems = await orderItemsRes.json();
      let processedData = null;
      
      if (type === 'x-report') processedData = generateXReport(orders);
      else if (type === 'z-report') processedData = generateZReport(orders);
      else if (type === 'sales') processedData = generateSalesReport(orders, orderItems, data.menuItems, data.categories, dateRange);
      else if (type === 'product') processedData = generateProductUsage(orders, orderItems, data.recipes, dateRange);
      else if (type === 'low-stock') processedData = data.ingredients.filter(i => parseFloat(i.stock_level) < parseFloat(i.low_stock_threshold));
      
      setReportResult(processedData);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const generateXReport = (orders) => {
    const todayStr = getLocalDateString();
    const todaysOrders = orders.filter(o => getLocalDateString(new Date(o.order_date_time)) === todayStr);
    const hours = Array(24).fill(0).map((_, i) => ({ hour: i, orders: 0, gross: 0, cash: 0, card: 0, voids: 0 }));
    todaysOrders.forEach(o => {
      const hour = new Date(o.order_date_time).getHours();
      const hData = hours[hour];
      const total = parseFloat(o.total_price);
      hData.orders += 1;
      if (o.payment_method === 'VOID') hData.voids += total;
      else { hData.gross += total; if (o.payment_method === 'Cash') hData.cash += total; else hData.card += total; }
    });
    return { type: 'x-report', rows: hours.filter(h => h.orders > 0), totals: calculateTotals(hours) };
  };

  const generateZReport = (orders) => {
    const todayStr = getLocalDateString();
    const todaysOrders = orders.filter(o => getLocalDateString(new Date(o.order_date_time)) === todayStr);
    let totalSalesPreTax = 0, cardSalesPreTax = 0, voidTotalValue = 0, cashCount = 0, cardCount = 0, voidCount = 0;
    todaysOrders.forEach(o => {
      const total = parseFloat(o.total_price);
      const preTax = total / (1 + TAX_RATE);
      if (o.payment_method === 'VOID') { voidCount++; voidTotalValue += total; }
      else { totalSalesPreTax += preTax; if (o.payment_method === 'Cash') cashCount++; else { cardCount++; cardSalesPreTax += preTax; } }
    });
    return { type: 'z-report', data: { totalSalesPreTax, totalTax: totalSalesPreTax * TAX_RATE, grossSales: totalSalesPreTax * (1 + TAX_RATE), cashCount, cardCount, voidCount, voidTotalValue, serviceCharge: cardSalesPreTax * SERVICE_CHARGE_RATE } };
  };

  const generateSalesReport = (orders, orderItems, menuItems, categories, dates) => {
    const validOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date_time);
      const [sy, sm, sd] = dates.start.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const [ey, em, ed] = dates.end.split('-').map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      return orderDate >= start && orderDate <= end && o.payment_method !== 'VOID';
    });
    const salesMap = {};
    validOrders.forEach(order => {
      orderItems.filter(oi => oi.order === order.id).forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menu_item);
        if (!menuItem) return;
        if (!salesMap[item.menu_item]) {
          let catName = menuItem.category || 'Uncategorized';
          if (!isNaN(parseFloat(catName))) { const c = categories.find(cat => cat.id == catName); if (c) catName = c.name; }
          salesMap[item.menu_item] = { name: menuItem.name, category: catName, quantity: 0, revenue: 0 };
        }
        salesMap[item.menu_item].quantity += item.quantity;
        salesMap[item.menu_item].revenue += (item.quantity * parseFloat(menuItem.base_price));
      });
    });
    return { type: 'sales', data: Object.values(salesMap).sort((a, b) => b.revenue - a.revenue), period: dates };
  };

  const generateProductUsage = (orders, orderItems, recipes, dates) => {
    const validOrders = orders.filter(o => {
      const orderDate = new Date(o.order_date_time);
      const [sy, sm, sd] = dates.start.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const [ey, em, ed] = dates.end.split('-').map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      return orderDate >= start && orderDate <= end && o.payment_method !== 'VOID';
    });
    const usageMap = {};
    validOrders.forEach(order => {
      orderItems.filter(oi => oi.order === order.id).forEach(item => {
        recipes.filter(r => r.menu_item === item.menu_item).forEach(r => {
          usageMap[r.ingredient] = (usageMap[r.ingredient] || 0) + (r.quantity * item.quantity);
        });
      });
    });
    return { type: 'product', data: usageMap };
  };

  const ReportButton = ({ label, type }) => (
    <button 
      onClick={() => handleReportClick(type)}
      className={`
        w-full py-3 px-4 rounded-lg border font-medium text-sm transition-all shadow-sm text-left cursor-pointer
        ${reportType === type 
          ? 'bg-[#e5e7eb] border-[#9ca3af] text-black shadow-inner ring-1 ring-gray-300' 
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      {/* Left: Main Display Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <h1 className="text-3xl font-bold text-black">Reports & Analytics</h1>
        
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
             <span className="text-xs font-bold text-gray-500 mb-1 uppercase">From</span>
             <div className="bg-[#e5e5e5] p-2 rounded border border-gray-300 flex items-center gap-2 cursor-pointer">
                <span className="font-mono text-sm">{dateRange.start}</span>
                <input type="date" className="absolute opacity-0 w-8 cursor-pointer" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <Calendar size={16} className="text-gray-500" />
             </div>
          </div>
          <div className="flex flex-col">
             <span className="text-xs font-bold text-gray-500 mb-1 uppercase">To</span>
             <div className="bg-[#e5e5e5] p-2 rounded border border-gray-300 flex items-center gap-2 cursor-pointer">
                <span className="font-mono text-sm">{dateRange.end}</span>
                <input type="date" className="absolute opacity-0 w-8 cursor-pointer" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                <Calendar size={16} className="text-gray-500" />
             </div>
          </div>
        </div>

        <Card className="flex-1 overflow-auto bg-white border border-gray-200 shadow-md rounded-lg min-h-0 w-full">
          {!reportResult && !loading ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
               <p className="text-lg font-medium">Select a report to view data</p>
             </div>
          ) : loading ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="animate-spin text-[#d97706]" size={48} />
                <p className="font-medium text-sm">Loading...</p>
             </div>
          ) : (
             <div className="p-0 h-full overflow-auto custom-scrollbar w-full">
               <ReportViewer type={reportType} result={reportResult} meta={data} />
             </div>
          )}
        </Card>
      </div>

      {/* Right: "Other Reports" Panel */}
      <div className="w-72 flex flex-col flex-shrink-0">
        <Card className="h-full p-6 border border-gray-300 rounded-3xl shadow-lg bg-white flex flex-col">
          <h2 className="text-2xl font-bold text-black mb-6">Other Reports</h2>
          <div className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                <ReportButton label="X-Report" type="x-report" />
                <ReportButton label="Product Usage" type="product" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <ReportButton label="Popular Items" type="sales" />
                <ReportButton label="Low Stock" type="low-stock" />
            </div>
            
            <div className="mt-auto pt-6">
                <button 
                  onClick={() => handleReportClick('z-report')}
                  className="w-full py-3 px-4 rounded-lg border bg-[#e5e5e5] text-black font-bold text-center hover:bg-[#d4d4d4] transition-colors shadow-sm cursor-pointer"
                >
                  Z-Report
                </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportViewer({ type, result, meta }) {
  const HeaderCell = ({ children, align="left" }) => (
    <th className={`p-3 bg-white border-b border-gray-300 text-black font-bold text-${align} text-sm sticky top-0 z-10`}>
      {children}
    </th>
  );
  
  const Cell = ({ children, align="left", className="" }) => (
    <td className={`p-3 border-b border-gray-100 text-gray-700 text-sm ${className} text-${align}`}>
      {children}
    </td>
  );

  if (type === 'x-report') {
    return (
      <table className="w-full text-left border-collapse">
        <thead><tr><HeaderCell>Time</HeaderCell><HeaderCell>Period</HeaderCell><HeaderCell>Data</HeaderCell><HeaderCell>Displayed</HeaderCell></tr></thead>
        <tbody className="divide-y divide-gray-50">{result.rows.map(r => <tr key={r.hour} className="hover:bg-gray-50"><Cell>{r.hour}:00</Cell><Cell>60m</Cell><Cell>{r.orders} Orders</Cell><Cell>{formatCurrency(r.gross)}</Cell></tr>)}</tbody>
      </table>
    );
  }
  if (type === 'z-report') {
    const { data } = result;
    return (
      <div className="p-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Z-Report Summary</h2>
        <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Sales:</span><span>{formatCurrency(data.grossSales)}</span></div>
            <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(data.totalTax)}</span></div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between font-bold"><span>Total:</span><span>{formatCurrency(data.grossSales)}</span></div>
        </div>
      </div>
    );
  }
  if (type === 'sales') {
    return (
      <table className="w-full text-left border-collapse">
        <thead><tr><HeaderCell>Item Name</HeaderCell><HeaderCell>Category</HeaderCell><HeaderCell align="right">Qty</HeaderCell><HeaderCell align="right">Revenue</HeaderCell></tr></thead>
        <tbody>{result.data.map((row, idx) => <tr key={idx} className="hover:bg-gray-50"><Cell>{row.name}</Cell><Cell>{row.category}</Cell><Cell align="right">{row.quantity}</Cell><Cell align="right">{formatCurrency(row.revenue)}</Cell></tr>)}</tbody>
      </table>
    )
  }
  if (type === 'product') {
    return (
      <table className="w-full text-left border-collapse">
        <thead><tr><HeaderCell>Ingredient</HeaderCell><HeaderCell>Qty Used</HeaderCell></tr></thead>
        <tbody>{Object.entries(result.data).map(([id, qty]) => { const ing = meta.ingredients.find(i => i.id === parseInt(id)); return <tr key={id}><Cell>{ing ? ing.name : id}</Cell><Cell>{qty.toFixed(2)} {ing?.unit}</Cell></tr> })}</tbody>
      </table>
    );
  }
  if (type === 'low-stock') {
    return (
      <table className="w-full text-left border-collapse">
        <thead><tr><HeaderCell>Ingredient</HeaderCell><HeaderCell>Stock</HeaderCell><HeaderCell>Threshold</HeaderCell></tr></thead>
        <tbody>{result.map(item => <tr key={item.id} className="bg-red-50"><Cell className="font-bold text-red-700">{item.name}</Cell><Cell className="text-red-600">{item.stock_level}</Cell><Cell>{item.low_stock_threshold}</Cell></tr>)}</tbody>
      </table>
    );
  }
  return <div>Not implemented.</div>;
}

function calculateTotals(rows) {
  return rows.reduce((acc, r) => ({ orders: acc.orders + r.orders, gross: acc.gross + r.gross, cash: acc.cash + r.cash, card: acc.card + r.card, voids: acc.voids + r.voids }), { orders: 0, gross: 0, cash: 0, card: 0, voids: 0 });
}

// ============================================================================
// SUB-COMPONENTS: ORDER HISTORY
// ============================================================================

function OrdersHistoryView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('week');
  const [dateRange, setDateRange] = useState(() => { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 7); return { start: getLocalDateString(start), end: getLocalDateString(end) }; });
  const { items: sortedOrders, requestSort, sortConfig } = useSortableData(orders, { key: 'order_date_time', direction: 'descending' });

  useEffect(() => { fetchOrders(); }, [dateRange]);

  const setQuickRange = (type) => {
    const end = new Date(); const start = new Date();
    if (type === 'week') start.setDate(end.getDate() - 7);
    if (type === 'month') start.setMonth(end.getMonth() - 1);
    setDateRange({ start: getLocalDateString(start), end: getLocalDateString(end) }); setFilter(type);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/orders/`); const all = await res.json();
        const filtered = all.filter(o => {
            const orderDate = new Date(o.order_date_time);
            const [sy, sm, sd] = dateRange.start.split('-').map(Number); const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
            const [ey, em, ed] = dateRange.end.split('-').map(Number); const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
            return orderDate >= start && orderDate <= end;
        });
        setOrders(filtered);
    } catch(e) { alert("Error fetching orders"); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-[#fed7aa] flex justify-between items-center">
         <div className="flex gap-2">
             <button onClick={() => setQuickRange('week')} className={`px-3 py-1 rounded text-sm font-medium border cursor-pointer ${filter === 'week' ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-gray-600 border-gray-300'}`}>Past Week</button>
             <button onClick={() => setQuickRange('month')} className={`px-3 py-1 rounded text-sm font-medium border cursor-pointer ${filter === 'month' ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-gray-600 border-gray-300'}`}>Past Month</button>
         </div>
         <div className="flex items-center gap-2">
             <input type="date" className="p-1 border border-gray-300 rounded text-sm cursor-pointer" value={dateRange.start} onChange={e => { setFilter('custom'); setDateRange({...dateRange, start: e.target.value})}} />
             <span className="text-gray-400">-</span>
             <input type="date" className="p-1 border border-gray-300 rounded text-sm cursor-pointer" value={dateRange.end} onChange={e => { setFilter('custom'); setDateRange({...dateRange, end: e.target.value})}} />
             <button onClick={fetchOrders} className="ml-2 p-2 bg-[#d97706] text-white rounded hover:bg-[#b45309] cursor-pointer">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
             </button>
         </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 w-full">
        <div className="overflow-auto flex-1 custom-scrollbar w-full">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
               <Loader2 className="animate-spin text-[#d97706]" size={48} />
               <p className="font-medium text-sm">Loading Orders...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse relative">
            <thead>
                <tr className="bg-[#fffbeb]">
                <SortableHeader label="Order ID" sortKey="id" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Date" sortKey="order_date_time" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Employee" sortKey="employee" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Payment" sortKey="payment_type" sortConfig={sortConfig} requestSort={requestSort} />
                <th className="p-4 font-bold text-[#78350f] text-right border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb] z-10">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#fed7aa]">
                {sortedOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#fffbeb] transition-colors text-[#78350f]">
                    <td className="p-4 font-mono text-sm">#{order.id}</td>
                    <td className="p-4 text-sm">{formatDateTime(order.order_date_time)}</td>
                    <td className="p-4 text-sm">{order.employee || '-'}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold border ${order.payment_type === 'VOID' ? 'border-red-500 text-red-600 bg-red-50' : 'border-green-500 text-green-600 bg-green-50'}`}>{order.payment_type}</span></td>
                    <td className="p-4 text-right font-mono font-bold">{formatCurrency(order.total_price)}</td>
                </tr>
                ))}
            </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

function VoidOrderManager({ onRefresh }) {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/`); const allOrders = await res.json();
      const found = allOrders.find(o => o.id === parseInt(orderId));
      if (!found) { setError(`Order #${orderId} not found.`); setOrderData(null); }
      else { setError(null); setOrderData(found); }
    } catch (err) { setError("Error fetching orders."); } finally { setLoading(false); }
  };

  const handleVoid = async () => {
    if (!window.confirm(`Void Order #${orderData.id}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderData.id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...orderData, payment_method: 'VOID' }) });
      if (res.ok) { alert("Voided."); setOrderData(null); setOrderId(''); onRefresh(); } else alert("Failed.");
    } catch (e) { alert("Network error."); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="p-8 text-center bg-white rounded-3xl shadow-xl border border-[#fed7aa]">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-500" size={32} /></div>
        <h2 className="text-2xl font-bold mb-2 text-[#78350f]">Void Transaction</h2>
        <p className="text-[#92400e] mb-8 text-sm">Enter Order ID to locate and void</p>
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input className="flex-1 border border-[#fed7aa] p-3 rounded-xl text-center font-mono text-lg outline-none focus:ring-2 focus:ring-[#d97706] bg-[#fffbeb] placeholder-[#d97706]/30" placeholder="ORDER ID" value={orderId} onChange={e => setOrderId(e.target.value)} />
          <button className="bg-[#78350f] text-white p-3 rounded-xl hover:bg-[#92400e] shadow-lg cursor-pointer">
             {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
          </button>
        </form>
        {error && <p className="text-red-600 font-bold text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
        {orderData && (
          <div className="bg-[#fffbeb] p-4 rounded-xl text-left border border-[#fed7aa] shadow-inner">
            <div className="flex justify-between mb-2"><span className="text-xs font-bold text-[#92400e] uppercase">Date</span><span className="font-mono text-sm text-[#78350f]">{formatDateTime(orderData.order_date_time)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-xs font-bold text-[#92400e] uppercase">Status</span><span className={`font-bold text-sm ${orderData.payment_method === 'VOID' ? 'text-red-600' : 'text-green-600'}`}>{orderData.payment_method}</span></div>
            <div className="flex justify-between mb-4"><span className="text-xs font-bold text-[#92400e] uppercase">Total</span><span className="font-mono font-bold text-xl text-[#78350f]">{formatCurrency(orderData.total_price)}</span></div>
            {orderData.payment_method !== 'VOID' ? <ActionButton onClick={handleVoid} label="CONFIRM VOID" variant="danger" className="w-full py-3" disabled={loading} /> : <div className="text-center text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100">ALREADY VOIDED</div>}
          </div>
        )}
      </Card>
    </div>
  );
}