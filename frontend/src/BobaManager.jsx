import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search, FileText, Calendar, TrendingUp, Package, Users } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';
const TAX_RATE = 0.0825;
const SERVICE_CHARGE_RATE = 0.025;

function BobaManager() {
  const [activeTab, setActiveTab] = useState('menu-items');
  const [data, setData] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [zReportLastRunDate, setZReportLastRunDate] = useState(null);
  const [orderFilters, setOrderFilters] = useState({ startDate: '', endDate: '' });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    fetchData();
    fetchIngredients();
    fetchMenuItems();
    fetchEmployees();
    fetchRecipeItems();
    if (activeTab === 'orders') {
      fetchOrders();
      fetchOrderItems();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${activeTab}/`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch(`${API_BASE}/ingredients/`);
      setIngredients(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu-items/`);
      setMenuItems(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees/`);
      setEmployees(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecipeItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/recipe-items/`);
      setRecipeItems(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/`);
      const ordersData = await res.json();
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/order-items/`);
      setOrderItems(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (orderFilters.startDate) {
      filtered = filtered.filter(order => order.order_date >= orderFilters.startDate);
    }
    
    if (orderFilters.endDate) {
      filtered = filtered.filter(order => order.order_date <= orderFilters.endDate);
    }
    
    setFilteredOrders(filtered);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      // Handle cascading deletes/updates
      if (activeTab === 'employees') {
        // Reassign all orders from this employee to employee_id 1 (or first available)
        const firstEmployee = employees.find(e => e.employee_id !== id);
        if (firstEmployee) {
          const ordersRes = await fetch(`${API_BASE}/orders/`);
          const orders = await ordersRes.json();
          const employeeOrders = orders.filter(o => o.employee === id);
          
          for (const order of employeeOrders) {
            await fetch(`${API_BASE}/orders/${order.order_id}/`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...order, employee: firstEmployee.employee_id })
            });
          }
        }
      } else if (activeTab === 'menu-items') {
        // Delete associated recipe items first
        const recipes = recipeItems.filter(r => r.menu_item === id);
        for (const recipe of recipes) {
          await fetch(`${API_BASE}/recipe-items/${recipe.menu_item}/`, { method: 'DELETE' });
        }
      } else if (activeTab === 'ingredients') {
        // Check if ingredient is used in any recipes
        const usedInRecipes = recipeItems.some(r => r.ingredient === id);
        if (usedInRecipes) {
          alert('Cannot delete ingredient: it is used in menu item recipes. Remove it from recipes first.');
          return;
        }
      }
      
      await fetch(`${API_BASE}/${activeTab}/${id}/`, { method: 'DELETE' });
      fetchData();
      if (activeTab === 'employees') fetchEmployees();
      if (activeTab === 'menu-items') fetchRecipeItems();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSave = async (formData) => {
    try {
      const url = modalMode === 'add' 
        ? `${API_BASE}/${activeTab}/`
        : `${API_BASE}/${activeTab}/${currentItem.id}/`;
      
      await fetch(url, {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setModalOpen(false);
      setCurrentItem(null);
      fetchData();
      fetchRecipeItems();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    setModalOpen(true);
  };

  const openReportModal = (type) => {
    setReportType(type);
    setReportModalOpen(true);
  };

  const tabs = [
    { id: 'menu-items', label: 'Menu Items', icon: FileText },
    { id: 'ingredients', label: 'Inventory', icon: Package },
    { id: 'add-ons', label: 'Add-Ons', icon: Plus },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'orders', label: 'Orders', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-200">
      <div className="bg-amber-900 text-white p-6 shadow-lg">
        <h1 className="text-4xl font-bold">Manager Dashboard</h1>
      </div>

      <div className="flex overflow-x-auto bg-white shadow-md">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-amber-600 text-white border-b-4 border-amber-800' 
                  : 'bg-white text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-8">
        {activeTab === 'orders' ? (
          <OrdersView
            orders={filteredOrders}
            orderItems={orderItems}
            menuItems={menuItems}
            employees={employees}
            orderFilters={orderFilters}
            setOrderFilters={setOrderFilters}
            filterOrders={filterOrders}
          />
        ) : (
          <>
            <div className="mb-6 flex gap-4 flex-wrap">
              <button
                onClick={() => openModal('add')}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                <Plus size={20} /> Add New
              </button>

              <div className="flex-1"></div>

              <button
                onClick={() => openReportModal('sales')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
              >
                <TrendingUp size={18} /> Sales Report
              </button>
              <button
                onClick={() => openReportModal('product-usage')}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700"
              >
                <Package size={18} /> Product Usage
              </button>
              <button
                onClick={() => openReportModal('low-stock')}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700"
              >
                <Package size={18} /> Low Stock
              </button>
              <button
                onClick={() => openReportModal('x-report')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700"
              >
                <FileText size={18} /> X-Report
              </button>
              <button
                onClick={() => openReportModal('z-report')}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
              >
                <FileText size={18} /> Z-Report
              </button>
              <button
                onClick={() => openReportModal('void-order')}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700"
              >
                <X size={18} /> Void Order
              </button>
            </div>

            {loading ? (
              <div className="text-center text-2xl text-amber-900">Loading...</div>
            ) : (
              <DataTable 
                activeTab={activeTab}
                data={data}
                onEdit={(item) => openModal('edit', item)}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <Modal
          activeTab={activeTab}
          mode={modalMode}
          item={currentItem}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          ingredients={ingredients}
          menuItems={menuItems}
          employees={employees}
          recipeItems={recipeItems}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          type={reportType}
          onClose={() => setReportModalOpen(false)}
          zReportLastRunDate={zReportLastRunDate}
          setZReportLastRunDate={setZReportLastRunDate}
        />
      )}
    </div>
  );
}

function OrdersView({ orders, orderItems, menuItems, employees, orderFilters, setOrderFilters, filterOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

  const getOrderDetails = (orderId) => {
    const order = orders.find(o => o.order_id === orderId);
    const items = orderItems.filter(oi => oi.order === orderId);
    const employee = employees.find(e => e.employee_id === order?.employee);
    
    const itemsWithDetails = items.map(item => {
      const menuItem = menuItems.find(mi => mi.menu_item_id === item.menu_item);
      return {
        ...item,
        name: menuItem?.name || 'Unknown Item',
        price: menuItem?.price || 0
      };
    });

    const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    return {
      ...order,
      employeeName: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
      items: itemsWithDetails,
      subtotal,
      tax,
      total
    };
  };

  const viewOrderDetails = (orderId) => {
    const details = getOrderDetails(orderId);
    setSelectedOrder(details);
    setOrderDetailsOpen(true);
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-amber-900 mb-4">Filter Orders by Date</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold text-amber-900 mb-2">Start Date</label>
            <input
              type="date"
              value={orderFilters.startDate}
              onChange={(e) => setOrderFilters({ ...orderFilters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-amber-900 mb-2">End Date</label>
            <input
              type="date"
              value={orderFilters.endDate}
              onChange={(e) => setOrderFilters({ ...orderFilters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={filterOrders}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => {
              setOrderFilters({ startDate: '', endDate: '' });
              filterOrders();
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Order ID</th>
                <th className="px-4 py-3 text-left font-bold">Date</th>
                <th className="px-4 py-3 text-left font-bold">Time</th>
                <th className="px-4 py-3 text-left font-bold">Employee</th>
                <th className="px-4 py-3 text-left font-bold">Payment Type</th>
                <th className="px-4 py-3 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const employee = employees.find(e => e.employee_id === order.employee);
                return (
                  <tr key={order.order_id} className="border-b hover:bg-amber-50">
                    <td className="px-4 py-3 font-semibold text-amber-900">{order.order_id}</td>
                    <td className="px-4 py-3">{order.order_date}</td>
                    <td className="px-4 py-3">{order.order_time}</td>
                    <td className="px-4 py-3">
                      {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.payment_type === 'VOID' ? 'bg-red-100 text-red-800' :
                        order.payment_type === 'Cash' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewOrderDetails(order.order_id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {orderDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-amber-600 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Order Details - #{selectedOrder.order_id}</h2>
              <button onClick={() => setOrderDetailsOpen(false)} className="text-white hover:text-amber-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold">{selectedOrder.order_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="text-lg font-semibold">{selectedOrder.order_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="text-lg font-semibold">{selectedOrder.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Type</p>
                  <p className="text-lg font-semibold">{selectedOrder.payment_type}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-xl font-bold mb-4">Order Items</h3>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Tax ({(TAX_RATE * 100).toFixed(2)}%):</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-amber-900 border-t pt-2">
                  <span>Total:</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setOrderDetailsOpen(false)}
                className="w-full mt-6 bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataTable({ activeTab, data, onEdit, onDelete }) {
  const getIdField = () => {
    const idFields = {
      'menu-items': 'menu_item_id',
      'ingredients': 'ingredient_id',
      'add-ons': 'id',
      'employees': 'employee_id'
    };
    return idFields[activeTab] || 'id';
  };

  const getColumns = () => {
    if (!data.length) return [];
    return Object.keys(data[0]).filter(key => key !== getIdField());
  };

  const formatValue = (col, value) => {
    // Convert snake_case ingredient names to readable format
    if (activeTab === 'ingredients' && col === 'ingredient_name' && typeof value === 'string') {
      return value
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return String(value ?? '');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-amber-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-bold">ID</th>
              {getColumns().map(col => (
                <th key={col} className="px-4 py-3 text-left font-bold">
                  {col.replace(/_/g, ' ').toUpperCase()}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-amber-50">
                <td className="px-4 py-3 font-semibold text-amber-900">
                  {item[getIdField()]}
                </td>
                {getColumns().map(col => (
                  <td key={col} className="px-4 py-3">
                    {formatValue(col, item[col])}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item[getIdField()])}
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
    </div>
  );
}

function Modal({ activeTab, mode, item, onClose, onSave, ingredients, menuItems, employees, recipeItems }) {
  const [formData, setFormData] = useState(item || {});
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    if (activeTab === 'menu-items' && item && mode === 'edit') {
      const recipes = recipeItems.filter(r => r.menu_item === item.menu_item_id);
      setSelectedIngredients(recipes.map(r => ({
        ingredient_id: r.ingredient,
        quantity: r.quantity
      })));
    } else if (activeTab === 'menu-items' && mode === 'add') {
      setSelectedIngredients([]);
      const maxId = menuItems.length > 0 
        ? Math.max(...menuItems.map(m => m.menu_item_id)) 
        : 0;
      setFormData({ ...formData, menu_item_id: maxId + 1 });
    } else if (activeTab === 'add-ons' && mode === 'add') {
      const maxId = Math.max(...data.map(a => a.id || 0), 0);
      setFormData({ ...formData, id: maxId + 1 });
    } else if (activeTab === 'employees' && mode === 'add') {
      const maxId = employees.length > 0
        ? Math.max(...employees.map(e => e.employee_id))
        : 0;
      setFormData({ ...formData, employee_id: maxId + 1 });
    } else if (activeTab === 'ingredients' && mode === 'add') {
      setFormData({ ...formData, ingredient_id: '', ingredient_name: '' });
    }
  }, [item, mode, activeTab, menuItems, recipeItems, employees, data]);

  const getFields = () => {
    const fields = {
      'menu-items': [
        { name: 'menu_item_id', label: 'Menu Item ID', type: 'number', required: true, disabled: true },
        { name: 'category', label: 'Category', type: 'text', required: true },
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'price', label: 'Price', type: 'number', step: '0.01', required: true }
      ],
      'ingredients': [
        { name: 'ingredient_name', label: 'Ingredient Name', type: 'text', required: true },
        { name: 'stock_level', label: 'Stock Level', type: 'number', step: '0.01', required: true },
        { name: 'unit', label: 'Unit', type: 'text', required: true },
        { name: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number', step: '0.01', required: true }
      ],
      'add-ons': [
        { name: 'id', label: 'ID', type: 'number', required: true, disabled: true },
        { name: 'category', label: 'Category', type: 'text', required: true },
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'price', label: 'Price', type: 'number', step: '0.01', required: true },
        { name: 'ingredient_id', label: 'Ingredient', type: 'select', options: ingredients, required: false },
        { name: 'quantity', label: 'Quantity', type: 'number', step: '0.001', required: false }
      ],
      'employees': [
        { name: 'employee_id', label: 'Employee ID', type: 'number', required: true, disabled: true },
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'position', label: 'Position', type: 'text', required: true },
        { name: 'hire_date', label: 'Hire Date', type: 'date', required: true }
      ]
    };
    return fields[activeTab] || [];
  };

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: '', quantity: '' }]);
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const removeIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Handle ingredient name conversion to snake_case
    if (activeTab === 'ingredients') {
      const snakeCaseName = formData.ingredient_name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      const finalFormData = {
        ...formData,
        ingredient_id: snakeCaseName,
        ingredient_name: snakeCaseName
      };
      
      await onSave(finalFormData);
      return;
    }
    
    if (activeTab === 'menu-items') {
      await onSave(formData);
      
      if (mode === 'edit') {
        const existingRecipes = recipeItems.filter(r => r.menu_item === formData.menu_item_id);
        for (const recipe of existingRecipes) {
          await fetch(`${API_BASE}/recipe-items/${recipe.menu_item}/`, { method: 'DELETE' });
        }
      }
      
      for (const ing of selectedIngredients) {
        if (ing.ingredient_id && ing.quantity) {
          await fetch(`${API_BASE}/recipe-items/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menu_item: formData.menu_item_id,
              ingredient: ing.ingredient_id,
              quantity: parseFloat(ing.quantity)
            })
          });
        }
      }
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-amber-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {mode === 'add' ? 'Add New' : 'Edit'} {activeTab.replace(/-/g, ' ').toUpperCase()}
          </h2>
          <button onClick={onClose} className="text-white hover:text-amber-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {activeTab === 'ingredients' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The ingredient name will be automatically converted to snake_case and used as the ID.
                  For example: "Brown Sugar" → "brown_sugar"
                </p>
              </div>
            )}

            {getFields().map(field => (
              <div key={field.name}>
                <label className="block text-sm font-bold text-amber-900 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => {
                      const id = opt.ingredient_id || opt.menu_item_id || opt.employee_id || opt.id;
                      const label = opt.ingredient_name || opt.name || `${opt.first_name} ${opt.last_name}` || id;
                      return <option key={id} value={id}>{label}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    step={field.step}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    disabled={field.disabled || (mode === 'edit' && field.name.includes('id'))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                  />
                )}
              </div>
            ))}

            {activeTab === 'menu-items' && (
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-amber-900">Recipe Ingredients</h3>
                  <button
                    onClick={addIngredient}
                    className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    <Plus size={16} /> Add Ingredient
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedIngredients.map((ing, idx) => {
                    const selectedIng = ingredients.find(i => i.ingredient_id === ing.ingredient_id);
                    return (
                      <div key={idx} className="flex gap-2 items-center bg-gray-50 p-3 rounded">
                        <select
                          value={ing.ingredient_id}
                          onChange={(e) => updateIngredient(idx, 'ingredient_id', e.target.value)}
                          className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">Select Ingredient...</option>
                          {ingredients.map(ingredient => {
                            const displayName = ingredient.ingredient_name
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            return (
                              <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                                {displayName}
                              </option>
                            );
                          })}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Quantity"
                            value={ing.quantity}
                            onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                            className="w-28 px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500"
                          />
                          {selectedIng && (
                            <span className="text-sm font-semibold text-amber-700 w-12">
                              {selectedIng.unit}
                            </span>
                          )}
                        </div>
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
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
            >
              <Check size={20} /> Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ type, onClose, zReportLastRunDate, setZReportLastRunDate }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderId, setOrderId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (type === 'sales') {
        // Sales report implementation
        alert('Sales Report: ' + startDate + ' to ' + endDate);
      } else if (type === 'product-usage') {
        alert('Product Usage Report: ' + startDate + ' to ' + endDate);
      } else if (type === 'low-stock') {
        const res = await fetch(`${API_BASE}/ingredients/`);
        const ingredients = await res.json();
        const lowStock = ingredients.filter(i => i.stock_level <= i.low_stock_threshold);
        setReportData(lowStock);
      } else if (type === 'x-report') {
        const today = new Date().toISOString().split('T')[0];
        if (today === zReportLastRunDate) {
          alert('Z-Report has been run for today. No further X-Report data.');
        } else {
          alert('X-Report for ' + today);
        }
      } else if (type === 'z-report') {
        const today = new Date().toISOString().split('T')[0];
        if (today === zReportLastRunDate) {
          alert('Z-Report has already been run for today.');
        } else {
          if (confirm('Run End-of-Day Z-Report? This should only be done once per day.')) {
            setZReportLastRunDate(today);
            alert('Z-Report generated for ' + today);
          }
        }
      } else if (type === 'void-order') {
        if (orderId) {
          if (confirm(`Are you sure you want to void order #${orderId}?`)) {
            alert('Order voided: ' + orderId);
          }
        }
      }
    } catch (err) {
      alert('Error generating report: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {type === 'sales' && 'Sales Report'}
            {type === 'product-usage' && 'Product Usage Report'}
            {type === 'low-stock' && 'Low Stock Report'}
            {type === 'x-report' && 'X-Report (Hourly Sales)'}
            {type === 'z-report' && 'Z-Report (End of Day)'}
            {type === 'void-order' && 'Void Order'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-blue-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {(type === 'sales' || type === 'product-usage') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {type === 'void-order' && (
            <div>
              <label className="block text-sm font-bold mb-2">Order ID</label>
              <input
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID to void"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}

          {reportData && type === 'low-stock' && (
            <div className="mt-4">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Ingredient</th>
                    <th className="px-4 py-2 text-left">Stock Level</th>
                    <th className="px-4 py-2 text-left">Threshold</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{item.ingredient_name}</td>
                      <td className="px-4 py-2">{item.stock_level}</td>
                      <td className="px-4 py-2">{item.low_stock_threshold}</td>
                      <td className="px-4 py-2">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={generateReport}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BobaManager;