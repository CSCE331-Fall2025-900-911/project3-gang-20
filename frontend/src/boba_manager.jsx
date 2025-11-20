import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Search, FileText, Calendar, TrendingUp, Package, Users, ArrowUp, ArrowDown, ArrowLeft
} from 'lucide-react';

// --- CONSTANTS ---

const API_BASE = 'https://project3-gang-20.onrender.com/api/';
const TAX_RATE = 0.0825;
const SERVICE_CHARGE_RATE = 0.025;

const TABS = [
  { id: 'menu-items', label: 'Menu Items', icon: FileText },
  { id: 'ingredients', label: 'Inventory', icon: Package },
  { id: 'customization-options', label: 'Custom Options', icon: Plus },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'orders', label: 'Orders', icon: Calendar }
];

function getReportTitle(type) {
  const titles = {
    sales: 'Sales Report',
    'product-usage': 'Product Usage Report',
    'low-stock': 'Low Stock Report',
    'x-report': 'X-Report (Hourly Sales)',
    'z-report': 'Z-Report (End of Day)',
    'void-order': 'Void Order'
  };
  return titles[type] || 'Report';
}

// --- HELPER: API Fetcher ---

const fetchEndpoint = async (endpoint, setData, setError) => {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}/`);
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    setData(await res.json());
  } catch (err) {
    console.error(err);
    setError(err);
    setData([]);
  }
};

// --- REUSABLE UI COMPONENTS ---

/**
 * A simple, functional primary button.
 */
function PrimaryButton({ onClick, children, icon: Icon, disabled = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

/**
 * A simple, functional secondary button.
 */
function SecondaryButton({ onClick, children, icon: Icon, disabled = false, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-gray-500 hover:bg-gray-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    info: 'bg-purple-500 hover:bg-purple-600 text-white',
    muted: 'bg-gray-300 hover:bg-gray-400 text-black',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

/**
 * A simple, functional icon-only button.
 */
function IconButton({ onClick, icon: Icon, disabled = false, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    muted: 'bg-gray-200 hover:bg-gray-300 text-black',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`inline-flex items-center justify-center p-2 rounded-md transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      <Icon size={18} />
    </button>
  );
}

/**
 * A simple, functional modal overlay.
 */
function ModalOverlay({ isOpen, onClose, children, title, icon: Icon }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-300">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={22} />}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * A simple, functional inline card for the sidebar.
 */
function InlineFormCard({ isOpen, onClose, children, title, icon: Icon }) {
  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={22} />}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1 rounded-full hover:bg-gray-200"
        >
          <X size={24} />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

/**
 * A simple, functional loading spinner.
 */
function Spinner() {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-lg text-gray-700 mt-4">Loading...</p>
    </div>
  );
}

// --- FEATURE COMPONENTS ---

/**
 * The main data table component.
 */
function DataTable({ activeTab, data, onEdit, onDelete }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  const idField = useMemo(() => {
    // FIX: All models now use 'id' as their primary key in the API.
    return 'id';
  }, [activeTab]);

  const sortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
        
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
       
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const columns = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0 || !data[0]) return [];
    
    return Object.keys(data[0]).filter(key => key !== 'id');
  }, [data, idField]);

  const formatValue = (col, value) => {
    // Format recipe
    if (col === 'recipe' && Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500 italic">No recipe</span>;
      }
      return (
        <ul className="list-disc list-inside text-left m-0 p-0">
          {value.map((r, idx) => (
            <li key={idx} className="text-gray-700">
              <span className="font-semibold">{r.ingredient.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:</span> {r.quantity} {r.unit}
            </li>
          ))}
        </ul>
      );
    }
    // Format arrays (like available_customizations)
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // Format dates
    if ((col === 'hire_date' || col === 'order_date_time' || col === 'joined_date') && value) {
      return new Date(value).toLocaleDateString();
    }
    // Format booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    // Format prices
    if (col.includes('price') || col.includes('total')) {
      return `$${Number(value).toFixed(2)}`;
    }
    // Format ingredient names
    if ((activeTab === 'ingredients' && col === 'name') || 
        (activeTab === 'customization-options' && col === 'ingredient')) {
      if (typeof value === 'string') {
        return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return value;
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (columns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
        <p className="text-lg text-gray-700">No data found for this category.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th
                className="p-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                onClick={() => handleSort(idField)}
              >
                {idField.toUpperCase()}
                {sortConfig.key === idField ? (sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />) : ''}
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  className="p-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                  onClick={() => handleSort(col)}
                >
                  {col.replace(/_/g, ' ').toUpperCase()}
                  {sortConfig.key === col ? (sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />) : ''}
                </th>
              ))}
              <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 text-gray-700 font-semibold border-r border-gray-200 align-top">{item[idField]}</td>
                {columns.map(col => (
                  <td key={col} className="p-3 text-gray-700 border-r border-gray-200 align-top">
                    {formatValue(col, item[col])}
                  </td>
                ))}
                <td className="p-3 flex gap-2 align-top">
                  <IconButton
                    onClick={() => onEdit(item)}
                    icon={Edit2}
                    variant="default"
                  />
                  <IconButton
                    onClick={() => onDelete(item.id)}
                    icon={Trash2}
                    variant="danger"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * The component for the Report modal.
 */
function GenerateReportModal({ type, onClose, zReportLastRunDate, setZReportLastRunDate }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderId, setOrderId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReportData(null);
    if (type === 'low-stock' || type === 'x-report' || type === 'z-report') {
      generateReport();
    }
  }, [type]);
  
  // Use a stable function for alerts/confirms
  const showAlert = (message) => {
    console.log("ALERT:", message);
    alert(message);
  };
  
  const showConfirm = (message) => {
    console.log("CONFIRM:", message);
    return window.confirm(message);
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      if (type === 'sales') {
        showAlert('Sales Report: ' + startDate + ' to ' + endDate);
      } else if (type === 'product-usage') {
        showAlert('Product Usage Report: ' + startDate + ' to ' + endDate);
      } else if (type === 'low-stock') {
        const res = await fetch(`${API_BASE}/ingredients/`);
        if (!res.ok) throw new Error('Failed to fetch ingredients');
        const ingredientsData = await res.json();
        const lowStock = ingredientsData.filter(i => i.stock_level <= i.low_stock_threshold);
        setReportData(lowStock);
      } else if (type === 'x-report') {
        const today = new Date().toISOString().split('T')[0];
        if (today === zReportLastRunDate) {
          showAlert('Z-Report has been run for today. No further X-Report data.');
        } else {
          showAlert('X-Report for ' + today);
          setReportData({ title: 'X-Report (Hourly Sales)', generated: new Date().toLocaleString() });
        }
      } else if (type === 'z-report') {
        const today = new Date().toISOString().split('T')[0];
        if (today === zReportLastRunDate) {
          showAlert('Z-Report has already been run for today.');
        } else {
          if (showConfirm('Run End-of-Day Z-Report? This should only be done once per day.')) {
            setZReportLastRunDate(today);
            showAlert('Z-Report generated for ' + today);
            setReportData({ title: 'Z-Report (End of Day)', generated: new Date().toLocaleString() });
          }
        }
      } else if (type === 'void-order') {
        if (orderId) {
          if (showConfirm(`Are you sure you want to void order #${orderId}?`)) {
            showAlert(`Order voided: #${orderId}`); // <-- THIS IS THE FIX
          }
        } else {
          showAlert('Please enter an Order ID.');
        }
      }
    } catch (err) {
      showAlert('Error generating report: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <>
       {(type === 'sales' || type === 'product-usage') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {type === 'void-order' && (
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-1">Order ID</label>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID to void"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-3 font-semibold">Generating report...</p>
        </div>
      )}

      {reportData && type === 'low-stock' && (
        <div className="mt-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Low Stock Items</h3>
          {reportData.length > 0 ? (
            <div className="overflow-x-auto border border-orange-300 rounded-md">
              <table className="w-full border-collapse">
                <thead className="bg-orange-100 border-b border-orange-300">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700">Ingredient</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Stock Level</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Threshold</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 last:border-b-0 hover:bg-orange-50">
                      {/* FIX: Use 'name' field which is what the API sends */}
                      <td className="p-3 font-semibold text-gray-700">{item.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</td>
                      <td className="p-3 text-center font-bold text-red-600 text-lg">{item.stock_level}</td>
                      <td className="p-3 text-center text-gray-600">{item.low_stock_threshold}</td>
                      <td className="p-3 text-gray-700">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-green-100 border border-green-300 rounded-md p-4">
              <p className="text-green-800 font-bold text-md">All items are in stock!</p>
            </div>
          )}
        </div>
      )}

      {reportData && (type === 'x-report' || type === 'z-report') && (
        <div className="mt-4 bg-blue-100 rounded-md p-6 border border-blue-300">
          <h3 className="text-xl font-bold text-blue-900 mb-2">{reportData.title}</h3>
          <p className="text-blue-700 font-semibold">Generated at: {reportData.generated}</p>
        </div>
      )}

      <div className="flex gap-4 mt-6 border-t border-gray-200 pt-4">
        {(type === 'sales' || type === 'product-usage' || type === 'void-order') && (
          <PrimaryButton
            onClick={generateReport}
            disabled={loading}
            icon={FileText}
            className="flex-1"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </PrimaryButton>
        )}
        <SecondaryButton
          onClick={onClose}
          className="flex-1"
          variant="muted"
        >
          Close
        </SecondaryButton>
      </div>
    </>
  );
}

/**
 * The component for the Add/Edit modal.
 */
function AddEditModal({ activeTab, mode, item, onClose, onSave, onSaveRecipe, dependencies, onRefreshAllData }) {
  const { ingredients, menuItems, employees, recipeItems, data, customizationCategories, menuCategories, units } = dependencies;
  const [formData, setFormData] = useState(null); // <-- Start as null
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Create a reverse map from ingredient NAME to ID
  const ingredientNameMap = useMemo(() => 
    new Map(ingredients.map(i => [i.name, i.id])) // Use 'id' for ingredients
  , [ingredients]);

  const categoryNameMap = useMemo(() =>
    new Map(customizationCategories.map(c => [c.name, c.id]))
  , [customizationCategories]);

  const menuCategoryNameMap = useMemo(() =>
    new Map(menuCategories.map(m => [m.name, m.id]))
  , [menuCategories]);
  
  const unitAbbrMap = useMemo(() =>
    new Map(units.map(u => [u.abbreviation, u.id]))
  , [units]);

  useEffect(() => {
    if (mode === 'edit' && item) {
      
      // Start with the basic item data
      let formDataToSet = { ...item };

      // Look up the correct ID from the string name
      if (activeTab === 'customization-options') {
        formDataToSet.category = categoryNameMap.get(item.category);
        formDataToSet.ingredient = ingredientNameMap.get(item.ingredient); 
      } 
      else if (activeTab === 'menu-items') {
        formDataToSet.category = menuCategoryNameMap.get(item.category);
      } 
      else if (activeTab === 'ingredients') {
        formDataToSet.unit = unitAbbrMap.get(item.unit);
      }
      
      setFormData(formDataToSet);
      
      // Special logic just for menu-item recipes
      if (activeTab === 'menu-items') {
        const recipes = recipeItems.filter(r => r.menu_item === item.id);
        setSelectedIngredients(recipes.map(r => ({
          // Look up the ID from the string name
          ingredient_id: ingredientNameMap.get(r.ingredient) || '', 
          quantity: r.quantity 
        })));
      }
    } 
    // 2. If mode is 'add', set the form to the correct blank defaults.
    else if (mode === 'add') {
      setSelectedIngredients([]); // Always clear recipes
      
      // Set the correct blank slate for the active tab
      if (activeTab === 'menu-items') {
        setFormData({ name: '', base_price: 0.00, category: '' });
      } else if (activeTab === 'customization-options') {
        setFormData({ name: '', price: 0.00, category: '', ingredient: null, quantity: 1.0 });
      } else if (activeTab === 'employees') {
        setFormData({ first_name: '', last_name: '', position: '', hire_date: '' });
      } else if (activeTab === 'ingredients') {
        // This fixes the bug where it was using old/wrong field names
        setFormData({ name: '', stock_level: 0, unit: null, low_stock_threshold: 0 });
      } else {
        setFormData({}); // Fallback
      }
    }
    // We only want this effect to run when the *item* or *mode* changes.
  }, [item, mode, activeTab, recipeItems, ingredientNameMap, categoryNameMap, menuCategoryNameMap, unitAbbrMap]);

  const getFields = () => {
     const fields = {
      'menu-items': [
        { name: 'name', label: 'Item Name', type: 'text', required: true },
        { name: 'base_price', label: 'Base Price', type: 'number', step: '0.01', required: true },
        { name: 'category', label: 'Category', type: 'select', options: menuCategories, required: true, idKey: 'id', labelKey: 'name' }
      ],
      'ingredients': [
        { name: 'name', label: 'Ingredient Name', type: 'text', required: true },
        { name: 'stock_level', label: 'Stock Level', type: 'number', step: '0.01', required: true },
        { name: 'unit', label: 'Unit', type: 'select', options: units, required: true, idKey: 'id', labelKey: 'abbreviation' },
        { name: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number', step: '0.01', required: true }
      ],
      'customization-options': [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'price', label: 'Price', type: 'number', step: '0.01', required: true },
        { name: 'category', label: 'Category', type: 'select', options: customizationCategories, required: true, idKey: 'id', labelKey: 'name' },
        { name: 'ingredient', label: 'Ingredient (Optional)', type: 'select', options: ingredients, required: false, idKey: 'id', labelKey: 'name' },
        { name: 'quantity', label: 'Quantity (in Ingredient\'s unit)', type: 'number', step: '0.01', required: true },
      ],
      'employees': [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'position', label: 'Position', type: 'text', required: true },
        { name: 'hire_date', label: 'Hire Date', type: 'date', required: true }
      ],
      'orders': []
    };
    return fields[activeTab] || [];
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    
    // Handle numbers
    if (type === 'number') {
      finalValue = value === '' ? null : parseFloat(value);
    }
    // Handle 'null' for optional selects
    if (type === 'select-one' && value === '') {
      finalValue = null;
    }
    // Set optional ingredient to null if empty
    if (name === 'ingredient' && value === '') { 
      finalValue = null;
    }
    setFormData(prevData => ({
      ...prevData,
      [name]: finalValue
    }));
  };

  const addIngredient = () => {
    setSelectedIngredients(prev => [...prev, { ingredient_id: '', quantity: 0 }]);
  };

  const removeIngredient = (index) => {
    setSelectedIngredients(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setSelectedIngredients(prev =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    let finalFormData = { ...formData };
    
    // This snake_case conversion is only for NEW ingredients
    if (activeTab === 'ingredients' && mode === 'add') {
      const snakeCaseName = formData.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      finalFormData = {
        ...formData,
        name: snakeCaseName
      };
    }
    
    try {
      // Save the main item (and get the returned object)
      const savedItem = await onSave(finalFormData);
      
      // If it was a menu item, also save the recipe
      if (activeTab === 'menu-items' && savedItem) {
        await onSaveRecipe(savedItem.id, selectedIngredients);
      }
      
      // NOW, refresh everything just once.
      await onRefreshAllData();
      
      onClose();
    } catch (err) {
      console.error('Failed to save', err);
      alert('Failed to save item: ' + err.message);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {activeTab === 'ingredients' && (
          <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> New ingredient names will be converted to snake_case (e.g., "Brown Sugar" → "brown_sugar").
            </p>
          </div>
        )}

        {getFields().map(field => (
          <div key={field.name}>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={formData ? formData[field.name] || '' : ''} // <-- Add check for formData
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="">{`Select ${field.label}...`}</option>
                {field.options.map(opt => (
                  <option key={opt[field.idKey]} value={opt[field.idKey]}>
                    {opt[field.labelKey]}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                step={field.step}
                value={formData ? formData[field.name] || '' : ''} // <-- Add check for formData
                onChange={handleFormChange}
                disabled={field.disabled || (mode === 'edit' && field.name.includes('id')) || (activeTab === 'ingredients' && mode === 'edit' && field.name === 'name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              />
            )}
          </div>
        ))}

        {activeTab === 'menu-items' && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Recipe Ingredients</h3>
            <div className="space-y-2">
              {selectedIngredients.map((ing, idx) => {
                const selectedIng = ingredients.find(i => i.id === ing.ingredient_id);
                const displayUnit = selectedIng ? selectedIng.unit : 'unit';
                
                return (
                  <div key={idx} className="flex gap-2 items-center bg-gray-100 p-3 rounded-md border border-gray-200">
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) => handleIngredientChange(idx, 'ingredient_id', parseInt(e.target.value, 10))}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">Select Ingredient...</option>
                      {ingredients.map(ingredient => {
                        const displayName = ingredient.name // Use 'name' field
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        
                        const displayUnit = ingredient.unit ? ` (${ingredient.unit})` : '';

                        return (
                          <option key={ingredient.id} value={ingredient.id}>
                            {displayName}{displayUnit}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      className="w-1/4 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <span className="w-1/8 text-gray-600 font-semibold">{displayUnit}</span>
                    <IconButton
                      onClick={() => removeIngredient(idx)}
                      icon={Trash2}
                      variant="danger"
                    />
                  </div>
                );
              })}
            </div>
            <PrimaryButton
              onClick={addIngredient}
              icon={Plus}
              className="mt-3 w-full"
            >
              Add Ingredient
            </PrimaryButton>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6 border-t border-gray-200 pt-4">
        <PrimaryButton
          onClick={handleSubmit}
          icon={Check}
          className="flex-1"
        >
          Save Changes
        </PrimaryButton>
        <SecondaryButton
          onClick={onClose}
          className="flex-1"
          variant="muted"
        >
          Cancel
        </SecondaryButton>
      </div>
    </>
  );
}

/**
 * The component for the Orders tab.
 */
function OrdersView({ orders, orderItems, menuItems, employees, customizationOptions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Create lookup maps for performance ---
  const employeeMap = useMemo(() => 
    new Map(employees.map(e => [e.id, `${e.first_name} ${e.last_name}`]))
  , [employees]);


  // --- This is the new, refactored logic ---
  const processedOrders = useMemo(() => {
    return orders.map(order => {
      // 1. Get Employee Name
      const employeeName = employeeMap.get(order.employee) || 'Unknown';
      
      // 2. Format Date
      const orderDate = new Date(order.order_date_time);
      const formattedDate = orderDate.toLocaleString();
      const simpleDate = orderDate.toISOString().split('T')[0]; // For default filtering

      // 3. Process Items and Calculate Total
      let subtotal = 0;
      const processedItems = order.items.map(item => {
        // The menu_item and customizations objects are now sent fully from the backend
        const menuItem = item.menu_item;
        
        let itemBasePrice = parseFloat(menuItem?.base_price) || 0;
        
        // Process customizations
        let customizationTotal = 0;
        const processedCustomizations = item.customizations.map(cust => {
          const custPrice = parseFloat(cust.price) || 0;
          customizationTotal += custPrice;
          return { name: cust.name, price: custPrice };
        });

        const itemTotal = (itemBasePrice + customizationTotal) * item.quantity;
        subtotal += itemTotal;
        
        return {
          ...item,
          name: menuItem?.name || 'Unknown Item',
          basePrice: itemBasePrice,
          customizations: processedCustomizations,
          itemTotal: itemTotal,
        };
      });

      // 4. Calculate Grand Total
      const tax = subtotal * TAX_RATE;
      const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
      const total = subtotal + tax + serviceCharge;
      
      return {
        ...order,
        employeeName,
        formattedDate,
        simpleDate, // e.g., "2025-11-20"
        items: processedItems, // Overwrite with processed items
        subtotal,
        tax,
        serviceCharge,
        total
      };
    });
  }, [orders, employees]); // Removed dependencies that are no longer needed
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = processedOrders.filter(order => order.simpleDate === today);
    setFilteredOrders(todaysOrders);
  }, [processedOrders]);
  
  const handleSearch = () => {
    setLoading(true);
    
    const filtered = processedOrders.filter(order => {
      const search = searchTerm.toLowerCase();
      return (
        String(order.id).includes(search) || 
        order.employeeName?.toLowerCase().includes(search) ||
        order.formattedDate?.toLowerCase().includes(search)
      );
    });
    
    setFilteredOrders(filtered);
    setLoading(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilteredOrders([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Search Orders</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search by Order ID or Employee Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md"
          />
          <PrimaryButton onClick={handleSearch} icon={Search}>
            Search
          </PrimaryButton>
          <SecondaryButton onClick={handleClear} icon={X} variant="muted">
            Clear
          </SecondaryButton>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Order ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Date</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Employee</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Payment Type</th>
                  <th className="p-3 text-right font-semibold text-gray-700 border-r border-gray-300">Total</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => {
                    // All data is now pre-processed and available on 'order'
                    return (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 text-gray-700 font-semibold border-r border-gray-200">#{order.id}</td>
                        <td className="p-3 text-gray-700 border-r border-gray-200">{order.formattedDate}</td>
                        <td className="p-3 text-gray-700 border-r border-gray-200">{order.employeeName}</td>
                        <td className="p-3 text-gray-700 border-r border-gray-200">{order.payment_type}</td>
                        <td className="p-3 text-right font-semibold text-gray-800 border-r border-gray-200">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <PrimaryButton onClick={() => setSelectedOrder(order)} className="text-sm">
                            View Details
                          </PrimaryButton>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      {searchTerm ? 'No orders found for your search.' : "No orders found for today."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <ModalOverlay 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: #${selectedOrder?.id}`}
        icon={FileText}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div>
                <span className="font-bold text-gray-700">Date:</span> {selectedOrder.formattedDate}
              </div>
              <div>
                <span className="font-bold text-gray-700">Employee:</span> {selectedOrder.employeeName}
              </div>
              <div>
                <span className="font-bold text-gray-700">Customer:</span> {selectedOrder.customer || 'N/A'}
              </div>
              <div>
                <span className="font-bold text-gray-700">Payment:</span> {selectedOrder.payment_type}
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-4 space-y-3">
              <h4 className="text-xl font-bold text-gray-800 mb-2">Items</h4>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${item.itemTotal.toFixed(2)}</span>
                  </div>
                  <div className="pl-6 text-gray-600">
                    <div>Base Price: ${item.basePrice.toFixed(2)}</div>
                    {item.customizations.map((cust, cIdx) => (
                      <div key={cIdx} className="flex justify-between text-sm">
                        <span>+ {cust.name}</span>
                        <span>+${cust.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-right text-lg">
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Subtotal:</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Service Charge ({ (SERVICE_CHARGE_RATE * 100).toFixed(1) }%)</span>
                <span>${selectedOrder.serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Tax ({ (TAX_RATE * 100).toFixed(2) }%)</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-2xl text-black border-t-2 border-gray-300 pt-2 mt-2">
                <span>Total:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
            
            <SecondaryButton onClick={() => setSelectedOrder(null)} variant="muted" className="w-full">
              Close
            </SecondaryButton>
          </div>
        )}
      </ModalOverlay>
    </div>
  );
}



/**
 * The main component for the Manager Dashboard.
 */
function BobaManager({ onBack }) {
  // --- STATE ---
  
  // UI State
  const [activeTab, setActiveTab] = useState('menu-items');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [zReportLastRunDate, setZReportLastRunDate] = useState(null);
  
  // Data State
  const [data, setData] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [customizationCategories, setCustomizationCategories] = useState([]);
  const [customizationOptions, setCustomizationOptions] = useState([]); // <-- ADDED
  const [menuCategories, setMenuCategories] = useState([]); // <-- ADDED
  const [units, setUnits] = useState([]); // <-- ADDED
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchActiveTabData = useCallback(async () => {
    if (!activeTab) return;
    setLoading(true);
    setError(null);
    await fetchEndpoint(activeTab, setData, setError);
    setLoading(false);
  }, [activeTab]);

  const fetchDependencies = useCallback(async () => {
    // running in parallel
    await Promise.all([
      fetchEndpoint('ingredients', setIngredients, setError),
      fetchEndpoint('menu-items', setMenuItems, setError),
      fetchEndpoint('employees', setEmployees, setError),
      fetchEndpoint('recipe-items', setRecipeItems, setError),
      fetchEndpoint('orders', setOrders, setError),
      // fetchEndpoint('order-items', setOrderItems, setError), // <-- REMOVED THIS REDUNDANT LINE
      fetchEndpoint('customization-categories', setCustomizationCategories, setError),
      fetchEndpoint('customization-options', setCustomizationOptions, setError),
      fetchEndpoint('menu-categories', setMenuCategories, setError),
      fetchEndpoint('units', setUnits, setError), 
    ]);
  }, []);
  
  const refreshAllData = useCallback(async () => {
    // This one function will refresh both the main table and all dropdown dependencies.
    await Promise.all([
      fetchActiveTabData(),
      fetchDependencies()
    ]);
  }, [fetchActiveTabData, fetchDependencies]);

  useEffect(() => {
    fetchActiveTabData();
  }, [fetchActiveTabData]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);


  const api = {
    deleteItem: async (id) => {
      
      try {
        await fetch(`${API_BASE}/${activeTab}/${id}/`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete: ' + err.message);
      }
    },

    saveItem: async (formData, mode, currentItem) => {
      const id = currentItem ? currentItem.id : null;
      const url = mode === 'add' 
        ? `${API_BASE}/${activeTab}/`
        : `${API_BASE}/${activeTab}/${id}/`;

      try {
        const res = await fetch(url, {
          method: mode === 'add' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errorBody = await res.json();
          throw new Error(JSON.stringify(errorBody));
        }
        
        // Return the saved item
        const savedItem = await res.json();
                
        return savedItem;
        
      } catch (err) {
        // Use console.error instead of alert
        console.error('Failed to save: ' + err.message);
        throw err;
      }
    },
    
    saveRecipe: async (menuItemId, recipeArray) => {
       const existingRecipes = recipeItems.filter(r => r.menu_item === menuItemId);
       for (const recipe of existingRecipes) {
         try {
           // Ensure correct delete endpoint using the recipe item's own ID
           await fetch(`${API_BASE}/recipe-items/${recipe.id}/`, { method: 'DELETE' });
         } catch (err) { console.error('Failed to delete old recipe item', err); }
       }
       for (const ing of recipeArray) {
         if (ing.ingredient_id && ing.quantity) {
           try {
             await fetch(`${API_BASE}/recipe-items/`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 menu_item: menuItemId,
                 ingredient: ing.ingredient_id, // This should be the ID
                 quantity: parseFloat(ing.quantity)
               })
             });
           } catch (err) { console.error('Failed to add new recipe item', err); }
         }
       }
    }
  };

  
  const handleOpenModal = (mode, item = null) => {
    setReportModalOpen(false); 
    setModalMode(mode);
    setCurrentItem(item);
    setModalOpen(true);
  };

  const handleOpenReportModal = (type) => {
    setModalOpen(false); 
    setReportType(type);
    setReportModalOpen(true);
  };

  const handleClosePopups = () => {
    setModalOpen(false);
    setReportModalOpen(false);
  };

  const handleSave = async (formData) => {
    return await api.saveItem(formData, modalMode, currentItem);
  };
  
  const handleSaveRecipe = async (menuItemId, recipeArray) => {
    await api.saveRecipe(menuItemId, recipeArray);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await api.deleteItem(id);
      await refreshAllData();
    }
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <div className="p-8 bg-white shadow-lg rounded-lg text-red-700">
          <h2 className="text-2xl font-bold mb-4">An Error Occurred</h2>
          <p>{error.message}</p>
          <PrimaryButton onClick={() => window.location.reload()} className="mt-4">
            Refresh Page
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const dependencies = { ingredients, menuItems, employees, recipeItems, orders, orderItems, data, customizationCategories, customizationOptions, menuCategories, units }; // <-- ADDED

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onBack && onBack()}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              title="Go Back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          </div>
          {/*some other header*/}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto flex overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon || FileText;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  handleClosePopups(); 
                }}
                type="button"
                className={`px-6 py-4 text-lg font-semibold flex items-center gap-2 ${
                  isActive
                    ? 'border-b-4 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-7xl">
        {activeTab === 'orders' ? (
          <OrdersView
            orders={dependencies.orders}
            orderItems={dependencies.orderItems}
            menuItems={dependencies.menuItems}
            employees={dependencies.employees}
            customizationOptions={dependencies.customizationOptions}
          />
        ) : (
          <div className="w-full space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Quick Actions</h3>
                  <PrimaryButton
                    onClick={() => handleOpenModal('add')}
                    icon={Plus}
                    className="w-full sm:w-auto"
                  >
                    Add New Item
                  </PrimaryButton>
                </div>
                <div className="flex-shrink-0">
                  <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Reports & Tools</h4>
                  <div className="flex flex-wrap gap-2"> 
                    <SecondaryButton onClick={() => handleOpenReportModal('sales')} icon={TrendingUp} variant="info" className="text-sm">
                      Sales
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleOpenReportModal('product-usage')} icon={Package} variant="default" className="text-sm">
                      Usage
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleOpenReportModal('low-stock')} icon={Package} variant="warning" className="text-sm">
                      Low Stock
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleOpenReportModal('x-report')} icon={FileText} variant="info" className="text-sm">
                      X-Report
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleOpenReportModal('z-report')} icon={FileText} variant="danger" className="text-sm">
                      Z-Report
                    </SecondaryButton>
                    <SecondaryButton onClick={() => handleOpenReportModal('void-order')} icon={X} variant="muted" className="text-sm">
                      Void Order
                    </SecondaryButton>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add/Edit Form Card */}
            <InlineFormCard
              isOpen={modalOpen}
              onClose={handleClosePopups}
              title={`${modalMode === 'add' ? 'Add New' : 'Edit'} ${activeTab.replace(/-/g, ' ').toUpperCase()}`}
              icon={modalMode === 'add' ? Plus : Edit2}
            >
              <AddEditModal
                activeTab={activeTab}
                mode={modalMode}
                item={currentItem}
                onClose={handleClosePopups}
                onSave={handleSave}
                onSaveRecipe={handleSaveRecipe}
                dependencies={dependencies} // Pass all data
                onRefreshAllData={refreshAllData} // <-- PASS THE REFRESH FUNCTION
              />
            </InlineFormCard>
            
            {/* Report Form Card */}
            <InlineFormCard
              isOpen={reportModalOpen}
              onClose={handleClosePopups}
              title={getReportTitle(reportType)}
              icon={FileText}
            >
              <GenerateReportModal
                type={reportType}
                onClose={handleClosePopups}
                zReportLastRunDate={zReportLastRunDate}
                setZReportLastRunDate={setZReportLastRunDate}
              />
            </InlineFormCard>
            
            {/* Main Data Table */}
            <div>
              {loading ? (
                <Spinner />
              ) : (
                <DataTable 
                  activeTab={activeTab}
                  data={data}
                  onEdit={(item) => handleOpenModal('edit', item)} // <-- THIS IS THE FIX
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BobaManager;