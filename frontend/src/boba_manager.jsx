/*
  File: boba_manager.jsx
  Description: Professional Manager Dashboard with optimized Server-Side Reporting.
  Features:
  - Architecture: Lazy loads data per tab; caches data to prevent re-fetching.
  - Optimization: 
      1. Reports: Uses dedicated backend endpoints for X/Z/Product reports.
      2. Pagination: Orders history uses pagination.
      3. Backend Lookup: Void Transaction uses direct ID lookup.
  - Compliance: 
      1. X-Report matches Java logic (Hour, Orders, Gross, Cash, Card, Voids).
      2. Z-Report implements "Once per day" lockout using localStorage.
      3. Sales Report includes Revenue totals.
  - UI: Kiosk-style visuals with Amber/Cream theme.
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Coffee, Package, Users, FileText, LogOut, Plus, Search,
  Trash2, Edit, Save, X, AlertTriangle, TrendingUp, Calendar, Clock,
  DollarSign, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, ClipboardList,
  Home, Loader2, RefreshCw, ChevronLeft, Lock, Unlock
} from 'lucide-react';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const API_BASE = 'https://project3-gang-20-810838872032.us-south1.run.app/api';

const COLORS = {
  bgGradient: 'from-[#fffbeb] to-[#fed7aa]',
  text: '#78350f',
  textSecondary: '#92400e',
  primary: '#d97706',
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
          // numeric sort
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
// SUB-COMPONENTS: REPORT HELPERS
// ============================================================================

const HeaderCell = ({ children, align = "left" }) => (
  <th className={`p-3 bg-white border-b border-gray-300 text-black font-bold text-${align} text-sm sticky top-0 z-10`}>
    {children}
  </th>
);

const Cell = ({ children, align = "left", className = "" }) => (
  <td className={`p-3 border-b border-gray-100 text-gray-700 text-sm ${className} text-${align}`}>
    {children}
  </td>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BobaManager({ onBack }) {
  const [activeTab, setActiveTab] = useState('menu');
  const navigate = useNavigate();

  // -- CENTRALIZED DATA STORE (CACHE) --
  const [dataStore, setDataStore] = useState({
    menuItems: [],
    ingredients: [],
    employees: [],
    recipes: [],
    categories: [],
    units: []
  });

  // -- LOAD STATUS TRACKER --
  const [loadStatus, setLoadStatus] = useState({
    menu: false,
    ingredients: false,
    inventory: false,
    employees: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- GRANULAR FETCHING LOGIC ---

  const fetchMenuData = useCallback(async (forceRefresh = false) => {
    if (loadStatus.menu && loadStatus.ingredients && !forceRefresh) return;
    setLoading(true);
    try {
      const promises = [];
      if (!loadStatus.menu || forceRefresh) {
        promises.push(fetch(`${API_BASE}/menu-items/`).then(r => r.json()));
        promises.push(fetch(`${API_BASE}/recipe-items/`).then(r => r.json()));
        promises.push(fetch(`${API_BASE}/menu-categories/`).then(r => r.json()));
      } else {
        promises.push(Promise.resolve(dataStore.menuItems));
        promises.push(Promise.resolve(dataStore.recipes));
        promises.push(Promise.resolve(dataStore.categories));
      }
      if (!loadStatus.ingredients || forceRefresh) {
        promises.push(fetch(`${API_BASE}/ingredients/`).then(r => r.json()));
      } else {
        promises.push(Promise.resolve(dataStore.ingredients));
      }
      const [menu, recipes, categories, ingredients] = await Promise.all(promises);
      setDataStore(prev => ({ ...prev, menuItems: menu, recipes, categories, ingredients }));
      setLoadStatus(prev => ({ ...prev, menu: true, ingredients: true }));
      setError(null);
    } catch (err) { setError("Failed to load menu data."); }
    finally { setLoading(false); }
  }, [loadStatus, dataStore]);

  const fetchInventoryData = useCallback(async (forceRefresh = false) => {
    if (loadStatus.inventory && loadStatus.ingredients && !forceRefresh) return;
    setLoading(true);
    try {
      const promises = [];
      if (!loadStatus.ingredients || forceRefresh) {
        promises.push(fetch(`${API_BASE}/ingredients/`).then(r => r.json()));
      } else {
        promises.push(Promise.resolve(dataStore.ingredients));
      }
      if (!loadStatus.inventory || forceRefresh) {
        promises.push(fetch(`${API_BASE}/units/`).then(r => r.json()));
      } else {
        promises.push(Promise.resolve(dataStore.units));
      }
      const [ingredients, units] = await Promise.all(promises);
      setDataStore(prev => ({ ...prev, ingredients, units }));
      setLoadStatus(prev => ({ ...prev, ingredients, units }));
      setLoadStatus(prev => ({ ...prev, inventory: true, ingredients: true }));
      setError(null);
    } catch (err) { setError("Failed to load inventory."); }
    finally { setLoading(false); }
  }, [loadStatus, dataStore]);

  const fetchEmployeeData = useCallback(async (forceRefresh = false) => {
    if (loadStatus.employees && !forceRefresh) return;
    setLoading(true);
    try {
      const empRes = await fetch(`${API_BASE}/employees/`);
      if (!empRes.ok) throw new Error("Failed");
      const employees = await empRes.json();
      setDataStore(prev => ({ ...prev, employees }));
      setLoadStatus(prev => ({ ...prev, employees: true }));
      setError(null);
    } catch (err) { setError("Failed to load employees."); }
    finally { setLoading(false); }
  }, [loadStatus]);

  // --- LAZY LOADING CONTROLLER ---
  useEffect(() => {
    switch (activeTab) {
      case 'menu': fetchMenuData(); break;
      case 'inventory': fetchInventoryData(); break;
      case 'employees': fetchEmployeeData(); break;
      case 'reports':
        if (!loadStatus.menu) fetchMenuData();
        if (!loadStatus.ingredients) fetchInventoryData();
        break;
    }
  }, [activeTab, fetchMenuData, fetchInventoryData, fetchEmployeeData, loadStatus]);

  const refreshMenu = () => fetchMenuData(true);
  const refreshInventory = () => fetchInventoryData(true);
  const refreshEmployees = () => fetchEmployeeData(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <MenuManager data={dataStore} onRefresh={refreshMenu} />;
      case 'inventory': return <InventoryManager data={dataStore} onRefresh={refreshInventory} />;
      case 'employees': return <EmployeeManager data={dataStore} onRefresh={refreshEmployees} />;
      case 'reports': return <ReportsDashboard data={dataStore} />;
      case 'orders': return <OrdersHistoryView />;
      case 'void': return <VoidOrderManager />;
      default: return <div className="p-8 text-center text-[#92400e]">Select a tab</div>;
    }
  };

  return (
    <div className={`h-screen bg-gradient-to-br ${COLORS.bgGradient} font-sans text-[#78350f] flex flex-col overflow-hidden`}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #fed7aa; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d97706; }
      `}</style>
      <div className="bg-white/80 backdrop-blur-md border-b border-[#fed7aa] px-6 py-4 flex-shrink-0 shadow-sm z-20 w-full">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="w-full flex justify-center items-center relative">
            <h1 className="text-3xl font-bold text-[#78350f] tracking-tight text-center">Manager Dashboard</h1>
          </div>
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
      <main className="flex-1 overflow-y-auto p-6 w-full scroll-smooth flex flex-col items-center relative custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full h-full mb-20">
          {loading && (
            <div className="flex items-center justify-center gap-3 text-[#d97706] mb-6 bg-white/50 py-2 px-4 rounded-full w-fit mx-auto shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm font-bold">Syncing...</span>
            </div>
          )}
          {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-md text-red-700 font-medium">{error}</div>}
          <div className="w-full flex-1 flex flex-col">{renderContent()}</div>
        </div>
        <button
          onClick={() => navigate('/')}
          type="button"
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
      type="button"
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
        {isActive && (sortConfig.direction === 'ascending' ? <ArrowUp size={14} className="text-[#d97706]" /> : <ArrowDown size={14} className="text-[#d97706]" />)}
      </div>
    </th>
  );
}

function ActionButton({ onClick, icon: Icon, label, variant = 'primary', disabled = false, className = "", type = "button" }) {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap cursor-pointer";
  const variants = {
    primary: "bg-[#ea580c] text-white hover:bg-[#c2410c] border border-transparent",
    secondary: "bg-white text-[#78350f] border border-[#d97706] hover:bg-[#fffbeb]",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
    success: "bg-[#16a34a] text-white hover:bg-green-700 border border-transparent",
    update: "bg-[#e5e7eb] text-black border border-[#9ca3af] hover:bg-[#d1d5db] uppercase text-xs tracking-wider px-3 py-1 shadow-sm"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
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
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/menu-items/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
        // Fallback: If hard-delete fails (likely 500 ProtectedError), offer to archive
        const isProtected = res.status === 500 || res.status === 400;
        if (isProtected) {
          if (window.confirm("Cannot permanently delete this item because it has sales history.\n\nWould you like to ARCHIVE it instead?\n(It will be hidden from all menus)")) {
            const archiveRes = await fetch(`${API_BASE}/menu-items/${id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_active: false })
            });
            if (!archiveRes.ok) throw new Error("Failed to archive item.");
          } else {
            return; // User cancelled
          }
        } else {
          throw new Error("Delete failed with status: " + res.status);
        }
      }
      onRefresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col w-full">
      <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-[#fed7aa] w-full">
        <h2 className="text-xl font-bold text-[#78350f]">Menu Items</h2>
        <ActionButton onClick={() => { setEditingItem(null); setIsModalOpen(true); }} icon={Plus} label="ADD NEW ITEM" variant="primary" />
      </div>
      <Card className="flex-1 flex flex-col min-h-0 w-full">
        <div className="overflow-auto flex-1 custom-scrollbar w-full">
          <table className="w-full text-left border-collapse relative">
            <thead>
              <tr className="bg-[#fffbeb]">
                <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Category" sortKey="category" sortConfig={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Price" sortKey="base_price" sortConfig={sortConfig} requestSort={requestSort} />
                <th className="p-4 font-bold text-[#78350f] text-center border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb] z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#fed7aa]">
              {sortedItems.map(item => (
                <tr key={item.id} className="hover:bg-[#fffbeb] transition-colors text-[#78350f]">
                  <td className="p-4 font-bold">{item.name}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4 font-mono font-bold">{formatCurrency(item.base_price)}</td>
                  <td className="p-4 text-center">
                    <ActionButton onClick={() => handleEdit(item)} label="UPDATE" variant="update" />
                    <button onClick={() => handleDelete(item.id)} type="button" className="text-red-500 hover:text-red-700 p-1 ml-2"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {isModalOpen && <MenuModal item={editingItem} data={data} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); onRefresh(); }} />}
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

      if (!menuRes.ok) {
        const errText = await menuRes.text();
        console.error("Save Error:", errText);
        throw new Error(`Failed to save menu item (${menuRes.status}): ${errText}`);
      }

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
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white custom-scrollbar">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Item Name</label>
              <input required className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Price ($)</label>
              <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Category</label>
            <select required className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              <option value="">Select Category...</option>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

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
          <ActionButton onClick={onClose} label="Cancel" variant="secondary" className="text-sm" type="button" />
          <ActionButton onClick={handleSubmit} label="Save Item" icon={Save} className="text-sm" type="submit" />
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
    <div className="space-y-6 h-full flex flex-col w-full">
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
                      <button onClick={() => handleDelete(item.id)} type="button" className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={18} /></button>
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
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Name</label>
            <input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Stock</label>
              <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.stock_level} onChange={e => setFormData({ ...formData, stock_level: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Unit</label>
              <select required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                <option value="">Select...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.abbreviation}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Threshold</label>
            <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800" value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: e.target.value })} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <ActionButton onClick={onClose} label="Cancel" variant="secondary" className="text-sm" type="button" />
            <ActionButton onClick={handleSubmit} label="Save" icon={Save} className="text-sm" type="submit" />
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
    <div className="space-y-6 h-full flex flex-col w-full">
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
                      <button onClick={() => handleDelete(emp.id)} type="button" className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={18} /></button>
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
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">First Name</label><input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Last Name</label><input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} /></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Position</label><input required className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} /></div>
          <div><label className="block text-xs font-bold text-gray-500 mb-1 font-mono uppercase">Hire Date</label><input required type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={formData.hire_date} onChange={e => setFormData({ ...formData, hire_date: e.target.value })} /></div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100"><ActionButton onClick={onClose} label="Cancel" variant="secondary" className="text-sm" type="button" /><ActionButton onClick={handleSubmit} label="Save" icon={Save} className="text-sm" type="submit" /></div>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: REPORTS - USING BACKEND AGGREGATION
// ============================================================================

function ReportsDashboard({ data }) {
  const [reportType, setReportType] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(),
    end: getLocalDateString()
  });
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zReportLocked, setZReportLocked] = useState(false);

  useEffect(() => {
    // Check local storage for Z-Report status on mount
    const lastRun = localStorage.getItem('zReportLastRunDate');
    const today = getLocalDateString();
    if (lastRun === today) {
      setZReportLocked(true);
    }
  }, []);

  // Effect to automatically run X and Z reports when selected
  useEffect(() => {
    if (reportType === 'x-report' || reportType === 'z-report') {
      generateReport(reportType);
    } else if (reportType === 'low-stock') {
      generateReport(reportType);
    } else {
      // Clear result for other types that require date selection
      setReportResult(null);
    }
  }, [reportType]);

  const handleReportClick = (type) => {
    setReportResult(null); // Clear previous result to show loading
    setReportType(type);
  };

  const resetZReportLock = () => {
    if (window.confirm("Reset Daily Lock for Z-Report? This will allow you to re-run the Z-Report for today.")) {
      localStorage.removeItem('zReportLastRunDate');
      setZReportLocked(false);
      setReportResult(null);
      setReportType(null);
    }
  };

  const generateReport = async (type) => {
    if (!type) return;

    // Logic for X-Report when Z-Report is locked (Closed)
    if (type === 'x-report' && zReportLocked) {
      setReportResult({ message: `Z-Report has been run for today (${getLocalDateString()}). Daily totals are finalized.` });
      return;
    }

    setLoading(true);

    try {
      // Default to TODAY for X and Z reports
      const todayStr = getLocalDateString();
      const start = (type === 'x-report' || type === 'z-report') ? todayStr : dateRange.start;
      const end = (type === 'x-report' || type === 'z-report') ? todayStr : dateRange.end;

      const params = `?start=${start}&end=${end}&date=${todayStr}`;
      let endpoint = '';

      if (type === 'x-report') endpoint = `${API_BASE}/orders/x_report/${params}`;
      else if (type === 'z-report') {
        // If locked, we just VIEW. If not locked, we CONFIRM then LOCK.
        if (!zReportLocked) {
          if (!window.confirm("Run End-of-Day Z-Report? This will close the day for X-Reports. This action should only be done once per day.")) {
            setLoading(false);
            setReportType(null); // Deselect
            return;
          }
          // Lock immediately upon confirmation
          localStorage.setItem('zReportLastRunDate', todayStr);
          setZReportLocked(true);
        }
        endpoint = `${API_BASE}/orders/z_report/${params}`;
      }
      else if (type === 'product') endpoint = `${API_BASE}/orders/product_usage/${params}`;
      else if (type === 'sales') endpoint = `${API_BASE}/orders/popular_items/${params}`;
      else if (type === 'low-stock') {
        // Low stock is instant from cached inventory
        const lowStock = data.ingredients.filter(i => parseFloat(i.stock_level) < parseFloat(i.low_stock_threshold));
        setReportResult(lowStock);
        setLoading(false);
        return;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to fetch report from server");
        const json = await res.json();
        setReportResult(json);
      }
    } catch (e) {
      console.error("Report Error: ", e);
    } finally {
      setLoading(false);
    }
  };

  const ReportButton = ({ label, type }) => (
    <button
      onClick={() => handleReportClick(type)}
      className={`
        w-full py-3 px-4 rounded-lg border font-medium text-sm transition-all shadow-sm text-left cursor-pointer flex justify-between items-center
        ${reportType === type
          ? 'bg-[#e5e7eb] border-[#9ca3af] text-black shadow-inner ring-1 ring-gray-300'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}
      `}
    >
      <span>{label}</span>
      {type === 'z-report' && zReportLocked && <Lock size={14} className="text-gray-400" />}
    </button>
  );

  // Only show date controls for reports that are NOT X, Z, or Low Stock
  const showDateControls = ['product', 'sales'].includes(reportType);

  return (
    <div className="h-full flex gap-6 w-full">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <h1 className="text-3xl font-bold text-black">Reports & Analytics</h1>
        <div className="flex gap-6 items-center">
          {showDateControls && (
            <>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 mb-1 uppercase">From</span>
                <input type="date" className="p-2 border rounded" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 mb-1 uppercase">To</span>
                <input type="date" className="p-2 border rounded" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
              <button onClick={() => generateReport(reportType)} type="button" className="bg-[#d97706] text-white px-4 py-2 rounded mt-4 cursor-pointer hover:bg-[#b45309]">Run Report</button>
            </>
          )}
          {!showDateControls && reportType === 'x-report' && <p className="text-gray-500 italic mt-4">Showing live X-Report for today.</p>}
          {!showDateControls && reportType === 'z-report' && <p className="text-gray-500 italic mt-4">{zReportLocked ? "Viewing finalized Z-Report for today." : "Closing day and generating Z-Report..."}</p>}
          {!showDateControls && reportType === 'low-stock' && <p className="text-gray-500 italic mt-4">Showing current low stock inventory items.</p>}
          {!reportType && <p className="text-gray-500 italic mt-4">Select a report type to begin.</p>}
        </div>

        <Card className="flex-1 overflow-auto bg-white border border-gray-200 shadow-md rounded-lg min-h-0 w-full">
          {!reportResult && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2"><p>Select a report to view data</p></div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="p-0 h-full overflow-auto custom-scrollbar w-full">
              <ReportViewer type={reportType} result={reportResult} />
            </div>
          )}
        </Card>
      </div>

      <div className="w-72 flex flex-col flex-shrink-0">
        <Card className="h-full p-6 border border-gray-300 rounded-3xl shadow-lg bg-white flex flex-col">
          <h2 className="text-2xl font-bold text-black mb-6">Reports</h2>
          <div className="flex-1 flex flex-col gap-3">
            <ReportButton label="X-Report" type="x-report" />
            <ReportButton label="Product Usage" type="product" />
            <ReportButton label="Popular Items" type="sales" />
            <ReportButton label="Low Stock" type="low-stock" />
            <div className="mt-auto pt-6 flex flex-col gap-2">
              <button
                onClick={() => handleReportClick('z-report')}
                className={`
                        w-full py-3 px-4 rounded-lg border font-bold text-center transition-colors shadow-sm cursor-pointer flex justify-center items-center gap-2
                        ${reportType === 'z-report'
                    ? 'bg-[#d97706] text-white border-[#d97706] shadow-inner'
                    : 'bg-[#e5e5e5] text-black hover:bg-[#d4d4d4] border-transparent'}
                      `}
              >
                {zReportLocked && <Lock size={16} />}
                {zReportLocked ? 'View Z-Report' : 'Run Z-Report'}
              </button>
              {zReportLocked && (
                <button
                  onClick={resetZReportLock}
                  className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer flex items-center justify-center gap-1"
                >
                  <Unlock size={12} /> Reset Lock
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportViewer({ type, result }) {
  if (!result) return null;
  if (result.message) return <div className="p-8 text-center text-gray-500 italic">{result.message}</div>;

  const rows = Array.isArray(result) ? result : (result.data || result.rows || []);

  if (type === 'x-report') {
    return (
      <div className="w-full">
        <table className="w-full text-left">
          <thead className="bg-[#fffbeb] sticky top-0">
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
            {Array.isArray(rows) && rows.length > 0 ? rows.map((r, idx) => (
              <tr key={`x-${r.hour}-${idx}`} className="border-b">
                <td className="p-3">{String(r.hour).padStart(2, '0')}:00-{String(r.hour).padStart(2, '0')}:59</td>
                <td className="p-3">{r.orders}</td>
                <td className="p-3">{formatCurrency(r.gross)}</td>
                <td className="p-3">{formatCurrency(r.cash)}</td>
                <td className="p-3">{formatCurrency(r.card)}</td>
                <td className="p-3">{formatCurrency(r.voids)}</td>
              </tr>
            )) : <tr><td colSpan="6" className="p-3 text-center text-gray-400">No Data</td></tr>}
          </tbody>
        </table>
        {result.totals && (
          <div className="bg-gray-100 p-3 font-bold flex justify-between border-t border-gray-300">
            <span>TOTAL</span>
            <span className="ml-auto pr-8">{formatCurrency(result.totals.gross)}</span>
          </div>
        )}
      </div>
    );
  }
  if (type === 'z-report') {
    const { data } = result;
    // result.hourly_breakdown comes from the updated backend view
    const hourlyRows = result.hourly_breakdown || [];

    if (!data) return <div className="p-8 text-gray-400">No data available</div>;
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Z-Report: End of Day ({data.date})</h2>
        <table className="w-full text-left border-collapse border border-gray-200 mb-8">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border border-gray-200">Category</th>
              <th className="p-3 border border-gray-200">Details</th>
              <th className="p-3 border border-gray-200">Amount / Count</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-3 border border-gray-200">SALES</td><td>Total Sales (Pre-Tax)</td><td className="p-3 border border-gray-200">{formatCurrency(data.totalSalesPreTax)}</td></tr>
            <tr><td className="p-3 border border-gray-200">SALES</td><td>Total Tax</td><td className="p-3 border border-gray-200">{formatCurrency(data.totalTax)}</td></tr>
            <tr><td className="p-3 border border-gray-200 font-bold">SALES</td><td className="font-bold">Gross Sales (Incl. Tax)</td><td className="p-3 border border-gray-200 font-bold">{formatCurrency(data.grossSales)}</td></tr>

            <tr><td className="p-3 border border-gray-200" colSpan="3"></td></tr>

            <tr><td className="p-3 border border-gray-200">PAYMENTS</td><td>Cash Orders (Total)</td><td className="p-3 border border-gray-200">{formatCurrency(data.totalCash)}</td></tr>
            <tr><td className="p-3 border border-gray-200">PAYMENTS</td><td>Card Orders (Total)</td><td className="p-3 border border-gray-200">{formatCurrency(data.totalCard)}</td></tr>

            <tr><td className="p-3 border border-gray-200" colSpan="3"></td></tr>

            <tr><td className="p-3 border border-gray-200 text-red-600">VOIDS</td><td>Voided Orders Count</td><td className="p-3 border border-gray-200">{data.voidCount}</td></tr>
            <tr><td className="p-3 border border-gray-200 text-red-600">VOIDS</td><td>Voided Orders Total Value</td><td className="p-3 border border-gray-200">{formatCurrency(data.voidValue)}</td></tr>

            <tr><td className="p-3 border border-gray-200" colSpan="3"></td></tr>

            <tr><td className="p-3 border border-gray-200">EMPLOYEES</td><td colSpan="2" className="italic">{data.employees ? data.employees.join(', ') : 'None'}</td></tr>
          </tbody>
        </table>

        {/* Hourly Breakdown included in Z-Report */}
        <h3 className="text-lg font-bold mb-2">Hourly Breakdown (Finalized)</h3>
        <table className="w-full text-left border border-gray-200">
          <thead className="bg-[#fffbeb]">
            <tr>
              <th className="p-2 border-b">Hour</th>
              <th className="p-2 border-b">Orders</th>
              <th className="p-2 border-b">Gross Sales</th>
              <th className="p-2 border-b">Cash</th>
              <th className="p-2 border-b">Card</th>
              <th className="p-2 border-b">Voids</th>
            </tr>
          </thead>
          <tbody>
            {hourlyRows.length > 0 ? hourlyRows.map((r, idx) => (
              <tr key={`z-hr-${r.hour}-${idx}`} className="border-b">
                <td className="p-2">{String(r.hour).padStart(2, '0')}:00</td>
                <td className="p-2">{r.orders}</td>
                <td className="p-2">{formatCurrency(r.gross)}</td>
                <td className="p-2">{formatCurrency(r.cash)}</td>
                <td className="p-2">{formatCurrency(r.card)}</td>
                <td className="p-2">{formatCurrency(r.voids)}</td>
              </tr>
            )) : <tr><td colSpan="6" className="p-2 text-center text-gray-400">No Data</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }
  if (type === 'sales') {
    // result.data is array
    return (
      <table className="w-full text-left">
        <thead className="bg-[#fffbeb] sticky top-0"><tr><th className="p-3">Item Name</th><th className="p-3">Category</th><th className="p-3">Total Quantity</th><th className="p-3">Total Sales</th></tr></thead>
        <tbody>
          {Array.isArray(rows) && rows.length > 0 ? rows.map((row, idx) => (
            <tr key={`sales-${idx}`} className="border-b"><td className="p-3 font-bold">{row.menu_item__name}</td><td className="p-3 text-sm">{row.menu_item__category__name}</td><td className="p-3">{row.total_qty}</td><td className="p-3">{formatCurrency(row.total_sales)}</td></tr>
          )) : <tr><td colSpan="4" className="p-3 text-center text-gray-400">No Data</td></tr>}
        </tbody>
      </table>
    )
  }
  if (type === 'product') {
    return (
      <table className="w-full text-left">
        <thead className="bg-[#fffbeb] sticky top-0"><tr><th className="p-3">Ingredient</th><th className="p-3">Amount Used</th></tr></thead>
        <tbody>
          {Array.isArray(rows) && rows.length > 0 ? rows.map((row, idx) => (
            <tr key={`prod-${idx}`} className="border-b"><td className="p-3 font-bold">{row.name}</td><td className="p-3 font-mono">{row.quantity?.toFixed(2)} {row.unit}</td></tr>
          )) : <tr><td colSpan="2" className="p-3 text-center text-gray-400">No Data</td></tr>}
        </tbody>
      </table>
    );
  }
  if (type === 'low-stock') {
    // result is array of ingredients
    return (
      <table className="w-full text-left border-collapse">
        <thead><tr><HeaderCell>Ingredient</HeaderCell><HeaderCell>Stock</HeaderCell><HeaderCell>Threshold</HeaderCell></tr></thead>
        <tbody>
          {Array.isArray(result) && result.length > 0 ? result.map((item, idx) => (
            <tr key={`ls-${item.id}-${idx}`} className="bg-red-50"><Cell className="font-bold text-red-700">{item.name}</Cell><Cell className="text-red-600">{item.stock_level}</Cell><Cell>{item.low_stock_threshold}</Cell></tr>
          )) : <tr><td colSpan="3" className="p-3 text-center text-gray-400">No Low Stock Items</td></tr>}
        </tbody>
      </table>
    );
  }
  return <div>Not implemented.</div>;
}

function calculateTotals(rows) {
  return rows.reduce((acc, r) => ({ orders: acc.orders + r.orders, gross: acc.gross + r.gross, cash: acc.cash + r.cash, card: acc.card + r.card, voids: acc.voids + r.voids }), { orders: 0, gross: 0, cash: 0, card: 0, voids: 0 });
}

// ============================================================================
// SUB-COMPONENTS: ORDER HISTORY (PAGINATED)
// ============================================================================

function OrdersHistoryView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  useEffect(() => { fetchOrders(0); }, []);

  const fetchOrders = async (offset) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/?limit=${LIMIT}&offset=${offset}`);
      const data = await res.json();
      // Handle paginated response (DRF uses 'results')
      const results = data.results || data;
      setOrders(results);
    } catch (e) { alert("Error fetching orders"); } finally { setLoading(false); }
  }

  const handleNext = () => {
    const newPage = page + 1;
    setPage(newPage);
    fetchOrders(newPage * LIMIT);
  };

  const handlePrev = () => {
    if (page === 0) return;
    const newPage = page - 1;
    setPage(newPage);
    fetchOrders(newPage * LIMIT);
  };

  return (
    <div className="space-y-4 h-full flex flex-col w-full">
      <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-[#fed7aa] flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#78350f]">Order History</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-[#92400e]">Page {page + 1}</span>
          <div className="flex gap-2">
            <button onClick={handlePrev} disabled={page === 0} type="button" className="p-2 rounded bg-white border border-gray-300 disabled:opacity-50 cursor-pointer"><ChevronLeft size={20} /></button>
            <button onClick={handleNext} type="button" className="p-2 rounded bg-white border border-gray-300 cursor-pointer"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 w-full">
        <div className="overflow-auto flex-1 custom-scrollbar w-full">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="animate-spin text-[#d97706]" size={48} />
              <p className="font-medium text-sm">Loading Page {page + 1}...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse relative">
              <thead>
                <tr className="bg-[#fffbeb]">
                  <th className="p-4 font-bold text-[#78350f] border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb]">Order ID</th>
                  <th className="p-4 font-bold text-[#78350f] border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb]">Date</th>
                  <th className="p-4 font-bold text-[#78350f] border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb]">Employee</th>
                  <th className="p-4 font-bold text-[#78350f] border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb]">Payment</th>
                  <th className="p-4 font-bold text-[#78350f] text-right border-b border-[#fed7aa] sticky top-0 bg-[#fffbeb]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#fed7aa]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-[#fffbeb] transition-colors text-[#78350f]">
                    <td className="p-4 font-mono text-sm">#{order.id}</td>
                    <td className="p-4 text-sm">{formatDateTime(order.order_date_time)}</td>
                    <td className="p-4 text-sm">{order.employee || '-'}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold border ${order.payment_type === 'VOID' ? 'border-red-500 text-red-600 bg-red-50' : 'border-green-500 text-green-600 bg-green-50'}`}>{order.payment_type}</span></td>
                    <td className="p-4 text-right font-mono font-bold">{formatCurrency(order.sub_total || order.total_price)}</td>
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

function VoidOrderManager() {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // OPTIMIZATION: Direct ID fetch instead of filtering all orders
      const res = await fetch(`${API_BASE}/orders/${orderId}/`);
      if (!res.ok) throw new Error("Order not found");
      const found = await res.json();
      setOrderData(found);
      setError('');
    } catch (err) {
      setError(`Order #${orderId} not found.`);
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!window.confirm(`Void Order #${orderData.id}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderData.id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...orderData, payment_method: 'VOID' }) });
      if (res.ok) { alert("Voided."); setOrderData(null); setOrderId(''); } else alert("Failed.");
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
          <button type="submit" className="bg-[#78350f] text-white p-3 rounded-xl hover:bg-[#92400e] shadow-lg cursor-pointer">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
          </button>
        </form>
        {error && <p className="text-red-600 font-bold text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
        {orderData && (
          <div className="bg-[#fffbeb] p-4 rounded-xl text-left border border-[#fed7aa] shadow-inner">
            <div className="flex justify-between mb-2"><span className="text-xs font-bold text-[#92400e] uppercase">Date</span><span className="fon http://127.0.0.1:8000/t-mono text-sm text-[#78350f]">{formatDateTime(orderData.order_date_time)}</span></div>
            <div className="flex justify-between mb-2"><span className="text-xs font-bold text-[#92400e] uppercase">Status</span><span className={`font-bold text-sm ${orderData.payment_method === 'VOID' ? 'text-red-600' : 'text-green-600'}`}>{orderData.payment_method}</span></div>
            <div className="flex justify-between mb-4"><span className="text-xs font-bold text-[#92400e] uppercase">Total</span><span className="font-mono font-bold text-xl text-[#78350f]">{formatCurrency(orderData.sub_total || orderData.total_price)}</span></div>
            {orderData.payment_method !== 'VOID' ? <ActionButton onClick={handleVoid} label="CONFIRM VOID" variant="danger" className="w-full py-3" disabled={loading} type="button" /> : <div className="text-center text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100">ALREADY VOIDED</div>}
          </div>
        )}
      </Card>
    </div>
  );
}