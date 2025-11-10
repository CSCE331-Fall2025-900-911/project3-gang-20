import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Search, FileText, Calendar, TrendingUp, Package, Users, ArrowUp, ArrowDown, LogOut
} from 'lucide-react';

const API_BASE = 'https://project3-gang-20.onrender.com/api';
const TAX_RATE = 0.0825;
const SERVICE_CHARGE_RATE = 0.025;

// ===== BUTTON COMPONENTS =====
function PrimaryButton({ onClick, children, icon: Icon, disabled = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl active:shadow-md ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children, icon: Icon, disabled = false, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    warning: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    info: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    muted: 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:shadow-sm ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

function IconButton({ onClick, icon: Icon, disabled = false, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    muted: 'bg-gray-500 hover:bg-gray-600 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:shadow-sm ${variants[variant]} ${className}`}
    >
      <Icon size={18} />
    </button>
  );
}

// ===== FLOATING MODAL (For Orders Page) =====
function ModalOverlay({ isOpen, onClose, children, title, icon: Icon }) {
  if (!isOpen) return null;

  return (
    // This is the floating container, with NO background dimming
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* This is the modal card with the black border */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp border-4 border-black">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 flex justify-between items-center sticky top-0 z-10 rounded-t-xl border-b-4 border-amber-800">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={28} />}
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===== INLINE FORM CARD (For Data Tabs) =====
function InlineFormCard({ isOpen, onClose, children, title, icon: Icon }) {
  if (!isOpen) return null;

  return (
    // This is the card, with the black border
    <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn border-4 border-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 flex justify-between items-center sticky top-0 z-10 rounded-t-xl border-b-4 border-amber-800">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={28} />}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}


// ===== MAIN COMPONENT =====
function BobaManager({ onBack }) {
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

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
      if (!res.ok) throw new Error(`Failed to fetch ${activeTab}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData([]);
    }
    setLoading(false);
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch(`${API_BASE}/ingredients/`);
      if (!res.ok) throw new Error('Failed to fetch ingredients');
      setIngredients(await res.json());
    } catch (err) {
      console.error(err);
      setIngredients([]);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu-items/`);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      setMenuItems(await res.json());
    } catch (err) {
      console.error(err);
      setMenuItems([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees/`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      setEmployees(await res.json());
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  const fetchRecipeItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/recipe-items/`);
      if (!res.ok) throw new Error('Failed to fetch recipe items');
      setRecipeItems(await res.json());
    } catch (err) {
      console.error(err);
      setRecipeItems([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const ordersData = await res.json();
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err) {
      console.error(err);
      setOrders([]);
      setFilteredOrders([]);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/order-items/`);
      if (!res.ok) throw new Error('Failed to fetch order items');
      setOrderItems(await res.json());
    } catch (err) {
      console.error(err);
      setOrderItems([]);
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
      if (activeTab === 'employees') {
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
        const recipes = recipeItems.filter(r => r.menu_item === id);
        for (const recipe of recipes) {
          await fetch(`${API_BASE}/recipe-items/${recipe.menu_item}/`, { method: 'DELETE' });
        }
      } else if (activeTab === 'ingredients') {
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
      const getIdField = () => {
        const idFields = {
          'menu-items': 'menu_item_id',
          'ingredients': 'ingredient_id',
          'add-ons': 'id',
          'employees': 'employee_id'
        };
        return idFields[activeTab] || 'id';
      };
      
      const idField = getIdField();
      const id = currentItem ? currentItem[idField] : formData[idField];
      const url = modalMode === 'add' 
        ? `${API_BASE}/${activeTab}/`
        : `${API_BASE}/${activeTab}/${id}/`;
      
      const res = await fetch(url, {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(JSON.stringify(errorBody));
      }
      
      setModalOpen(false);
      setCurrentItem(null);
      fetchData();
      if (activeTab === 'employees') fetchEmployees();
      if (activeTab === 'menu-items') {
        fetchMenuItems();
        fetchRecipeItems();
      }
      if (activeTab === 'ingredients') fetchIngredients();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const openModal = (mode, item = null) => {
    setReportModalOpen(false); 
    setModalMode(mode);
    setCurrentItem(item);
    setModalOpen(true);
  };

  const openReportModal = (type) => {
    setModalOpen(false); 
    setReportType(type);
    setReportModalOpen(true);
  };

  const closeAllPopups = () => {
    setModalOpen(false);
    setReportModalOpen(false);
  }

  // --- ADDED: Sorting handler ---
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- ADDED: Memoized sorted data ---
  const sortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
        
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // Handle case-insensitive string sorting
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

  const tabs = [
    { id: 'menu-items', label: 'Menu Items', icon: FileText },
    { id: 'ingredients', label: 'Inventory', icon: Package },
    { id: 'add-ons', label: 'Add-Ons', icon: Plus },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'orders', label: 'Orders', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header - Removed max-w-7xl */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white p-8 shadow-2xl border-b-4 border-amber-950">
        {/* Added px-8 to align with content padding */}
        <div className="px-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold">Manager Dashboard</h1>
          <button 
            onClick={() => onBack && onBack()}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation - Removed max-w-7xl */}
      <div className="bg-white shadow-lg border-b-4 border-amber-600">
        {/* Added px-8 to align with content padding */}
        <div className="flex overflow-x-auto px-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  closeAllPopups(); 
                }}
                type="button"
                // --- MODIFIED: Made tabs bigger ---
                className={`px-8 py-5 text-lg font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 mr-1 ${
                  isActive
                    ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-white border-b-4 border-amber-900 shadow-lg'
                    : 'bg-white text-amber-900 hover:bg-gradient-to-b hover:from-amber-100 hover:to-orange-100'
                }`}
              >
                <Icon size={22} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Removed max-w-7xl, p-8 provides the spacing */}
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
            onClose={closeAllPopups}
          />
        ) : (
          <div className="flex flex-col-reverse lg:flex-row gap-8">
            
            {/* Data Table - Left Side */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border-4 border-gray-200">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                  <p className="text-xl text-amber-900 mt-4">Loading...</p>
                </div>
              ) : (
                <DataTable 
                  activeTab={activeTab}
                  data={sortedData} /* --- MODIFIED: Pass sortedData --- */
                  onEdit={(item) => openModal('edit', item)}
                  onDelete={handleDelete}
                  onSort={handleSort} /* --- MODIFIED: Pass sort handler --- */
                  sortConfig={sortConfig} /* --- MODIFIED: Pass sort config --- */
                />
              )}
            </div>

            {/* Right Column (Actions + Inline Forms) */}
            <div className="lg:w-[32rem] flex-shrink-0">
              <div className="space-y-8 sticky top-8">
                
                {/* Quick Actions Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-amber-200">
                  <h3 className="text-xl font-bold text-amber-900 mb-6 pb-3 border-b-2 border-amber-200">Quick Actions</h3>
                  
                  <div className="space-y-4">
                    <PrimaryButton
                      onClick={() => openModal('add')}
                      icon={Plus}
                      className="w-full"
                    >
                      Add New Item
                    </PrimaryButton>

                    <div className="border-t-4 border-amber-100 pt-5 mt-5">
                      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Reports & Tools</h4>
                      <div className="space-y-4"> 
                        <SecondaryButton
                          onClick={() => openReportModal('sales')}
                          icon={TrendingUp}
                          variant="info"
                          className="w-full text-sm"
                        >
                          Sales Report
                        </SecondaryButton>

                        <SecondaryButton
                          onClick={() => openReportModal('product-usage')}
                          icon={Package}
                          variant="default"
                          className="w-full text-sm"
                        >
                          Product Usage
                        </SecondaryButton>

                        <SecondaryButton
                          onClick={() => openReportModal('low-stock')}
                          icon={Package}
                          variant="warning"
                          className="w-full text-sm"
                        >
                          Low Stock Alert
                        </SecondaryButton>

                        <SecondaryButton
                          onClick={() => openReportModal('x-report')}
                          icon={FileText}
                          variant="info"
                          className="w-full text-sm"
                        >
                          X-Report
                        </SecondaryButton>

                        <SecondaryButton
                          onClick={() => openReportModal('z-report')}
                          icon={FileText}
                          variant="danger"
                          className="w-full text-sm"
                        >
                          Z-Report
                        </SecondaryButton>

                        <SecondaryButton
                          onClick={() => openReportModal('void-order')}
                          icon={X}
                          variant="muted"
                          className="w-full text-sm"
                        >
                          Void Order
                        </SecondaryButton>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- INLINE FORM AREA --- */}
                
                <InlineFormCard
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  title={`${modalMode === 'add' ? 'Add New' : 'Edit'} ${activeTab.replace(/-/g, ' ').toUpperCase()}`}
                  icon={modalMode === 'add' ? Plus : Edit2}
                >
                  <Modal
                    data={data}
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
                </InlineFormCard>
                
                <InlineFormCard
                  isOpen={reportModalOpen}
                  onClose={() => setReportModalOpen(false)}
                  title={getReportTitle(reportType)}
                  icon={FileText}
                >
                  <ReportModal
                    type={reportType}
                    onClose={() => setReportModalOpen(false)}
                    zReportLastRunDate={zReportLastRunDate}
                    setZReportLastRunDate={setZReportLastRunDate}
                  />
                </InlineFormCard>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

// ===== ORDERS VIEW =====
function OrdersView({ orders, orderItems, menuItems, employees, orderFilters, setOrderFilters, filterOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

  const getOrderDetails = (orderId) => {
    const order = orders.find(o => o.order_id === orderId);
    if (!order) return null;
    
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
    if (details) {
      setSelectedOrder(details);
      setOrderDetailsOpen(true);
    } else {
      alert(`Could not find details for order ${orderId}`);
    }
  };

  return (
    <div>
      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-4 border-blue-200">
        <h3 className="text-xl font-bold text-amber-900 mb-6 pb-3 border-b-2 border-blue-200">Filter Orders</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={orderFilters.startDate}
              onChange={(e) => setOrderFilters({ ...orderFilters, startDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={orderFilters.endDate}
              onChange={(e) => setOrderFilters({ ...orderFilters, endDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
          <div className="lg:col-span-2">
            <SecondaryButton 
              onClick={filterOrders} 
              icon={Search}
              className="w-full"
            >
              Filter Orders
            </SecondaryButton>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-amber-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-b-4 border-amber-800">
              <tr>
                <th className="px-6 py-4 text-left font-bold">Order ID</th>
                <th className="px-6 py-4 text-left font-bold">Date</th>
                <th className="px-6 py-4 text-left font-bold">Employee</th>
                <th className="px-6 py-4 text-left font-bold">Payment Type</th>
                <th className="px-6 py-4 text-right font-bold">Total</th>
                <th className="px-6 py-4 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const details = getOrderDetails(order.order_id);
                const employee = employees.find(e => e.employee_id === order.employee);
                return (
                  <tr key={idx} className="border-b-2 border-gray-200 hover:bg-amber-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-amber-900">#{order.order_id}</td>
                    <td className="px-6 py-4">{order.order_date}</td>
                    <td className="px-6 py-4">{employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}</td>
                    <td className="px-6 py-4">{order.payment_type}</td>
                    <td className="px-6 py-4 text-right font-bold text-amber-900">
                      ${details?.total.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <IconButton
                          onClick={() => viewOrderDetails(order.order_id)}
                          icon={FileText}
                          variant="default"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal (Uses the FLOATING ModalOverlay) */}
      <ModalOverlay
        isOpen={orderDetailsOpen && !!selectedOrder}
        onClose={() => setOrderDetailsOpen(false)}
        title={`Order Details - #${selectedOrder?.order_id}`}
        icon={FileText}
      >
        {selectedOrder && (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-300">
                <p className="text-sm text-gray-600 font-semibold">Date</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">{selectedOrder.order_date}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-300">
                <p className="text-sm text-gray-600 font-semibold">Time</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{selectedOrder.order_time}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-2 border-purple-300">
                <p className="text-sm text-gray-600 font-semibold">Employee</p>
                <p className="text-2xl font-bold text-purple-900 mt-2">{selectedOrder.employeeName}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border-2 border-orange-300">
                <p className="text-sm text-gray-600 font-semibold">Payment Type</p>
                <p className="text-2xl font-bold text-orange-900 mt-2">{selectedOrder.payment_type}</p>
              </div>
            </div>

            <div className="border-t-4 border-gray-300 pt-6 mb-6">
              <h3 className="text-xl font-bold text-amber-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-5 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-amber-900 text-lg">{item.name}</p>
                      <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-8 border-4 border-amber-300 space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700 font-semibold">Subtotal:</span>
                <span className="font-bold text-amber-900">${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg border-b-2 border-amber-200 pb-4">
                <span className="text-gray-700 font-semibold">Tax ({(TAX_RATE * 100).toFixed(2)}%):</span>
                <span className="font-bold text-amber-900">${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-3xl font-bold pt-2">
                <span className="text-amber-900">Total:</span>
                <span className="text-amber-900">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <SecondaryButton
                onClick={() => setOrderDetailsOpen(false)}
                className="w-full"
                variant="muted"
              >
                Close
              </SecondaryButton>
            </div>
          </>
        )}
      </ModalOverlay>
    </div>
  );
}

// ===== DATA TABLE =====
// --- MODIFIED: Added onSort and sortConfig props ---
function DataTable({ activeTab, data, onEdit, onDelete, onSort, sortConfig }) {
  const getIdField = () => {
    const idFields = {
      'menu-items': 'menu_item_id',
      'ingredients': 'ingredient_id',
      'add-ons': 'id',
      'employees': 'employee_id'
    };
    return idFields[activeTab] || 'id';
  };
  const idField = getIdField();

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center border-4 border-gray-200">
        <Package size={64} className="mx-auto text-gray-400 mb-6" />
        <p className="text-2xl font-semibold text-gray-500">No data available for this category.</p>
        <p className="text-gray-400 mt-2">Click "Add New Item" to get started!</p>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {}).filter(key => key !== idField);

  const formatValue = (col, value) => {
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

  // --- ADDED: Helper to render sort icon ---
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null; // Or a default "unsorted" icon
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp size={16} className="text-white" />;
    }
    return <ArrowDown size={16} className="text-white" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-amber-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white sticky top-0 border-b-4 border-amber-800">
            <tr>
              {/* --- MODIFIED: Make ID header sortable --- */}
              <th
                className="px-6 py-4 text-left font-bold cursor-pointer hover:bg-amber-700 transition-colors"
                onClick={() => onSort(idField)}
              >
                <div className="flex items-center gap-2">
                  ID
                  {getSortIcon(idField)}
                </div>
              </th>
              
              {/* --- MODIFIED: Make other headers sortable --- */}
              {columns.map(col => (
                <th
                  key={col}
                  className="px-6 py-4 text-left font-bold cursor-pointer hover:bg-amber-700 transition-colors"
                  onClick={() => onSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col.replace(/_/g, ' ').toUpperCase()}
                    {getSortIcon(col)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-gray-200 hover:bg-amber-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-amber-900">{item[idField]}</td>
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 text-gray-700">
                    {formatValue(col, item[col])}
                  </td>
                ))}
                <td className="px-6 py-4">
                  <div className="flex gap-3 justify-center">
                    <IconButton
                      onClick={() => onEdit(item)}
                      icon={Edit2}
                      variant="default"
                    />
                    <IconButton
                      onClick={() => onDelete(item[idField])}
                      icon={Trash2}
                      variant="danger"
                    />
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

// ===== MODAL COMPONENT (The Form) =====
function Modal({ activeTab, mode, item, onClose, onSave, ingredients, menuItems, employees, recipeItems, data }) {
  const [formData, setFormData] = useState(item || {});
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    setFormData(item || {});
    if (activeTab === 'menu-items' && item && mode === 'edit') {
      const recipes = recipeItems.filter(r => r.menu_item === item.menu_item_id);
      setSelectedIngredients(recipes.map(r => ({
        ingredient_id: r.ingredient,
        quantity: r.quantity
      })));
    } else if (activeTab === 'menu-items' && mode === 'add') {
      setSelectedIngredients([]);
      const maxId = menuItems.length > 0 ? Math.max(...menuItems.map(m => m.menu_item_id)) : 0;
      setFormData({ menu_item_id: maxId + 1 });
    } else if (activeTab === 'add-ons' && mode === 'add') {
      const maxId = data && data.length > 0 ? Math.max(...data.map(a => a.id || 0)) : 0;
      setFormData({ id: maxId + 1 });
    } else if (activeTab === 'employees' && mode === 'add') {
      const maxId = employees.length > 0 ? Math.max(...employees.map(e => e.employee_id)) : 0;
      setFormData({ employee_id: maxId + 1 });
    } else if (activeTab === 'ingredients' && mode === 'add') {
      setFormData({ ingredient_id: '', ingredient_name: '' });
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

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
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
    if (activeTab === 'ingredients') {
      if (mode === 'add') {
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
      } else {
        await onSave(formData);
      }
      return;
    }

    if (activeTab === 'menu-items') {
      await onSave(formData);

      if (mode === 'edit') {
        const existingRecipes = recipeItems.filter(r => r.menu_item === formData.menu_item_id);
        for (const recipe of existingRecipes) {
          try {
            await fetch(`${API_BASE}/recipe-items/${recipe.menu_item}/`, { method: 'DELETE' });
          } catch (err) {
            console.error('Failed to delete old recipe item', err);
          }
        }
      }

      for (const ing of selectedIngredients) {
        if (ing.ingredient_id && ing.quantity) {
          try {
            await fetch(`${API_BASE}/recipe-items/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                menu_item: formData.menu_item_id,
                ingredient: ing.ingredient_id,
                quantity: parseFloat(ing.quantity)
              })
            });
          } catch (err) {
            console.error('Failed to add new recipe item', err);
          }
        }
      }
    } else {
      onSave(formData);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {activeTab === 'ingredients' && (
          <div className="bg-blue-50 border-4 border-blue-300 rounded-lg p-5">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>📝 Note:</strong> When adding, the ingredient name will be converted to snake_case and used as the ID.
              For example: "Brown Sugar" → "brown_sugar". This ID cannot be changed.
            </p>
          </div>
        )}

        {getFields().map(field => (
          <div key={field.name}>
            <label className="block text-sm font-bold text-amber-900 mb-3">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white"
              >
                <option value="">Select...</option>
                {field.options && field.options.map(opt => {
                  const id = opt.ingredient_id || opt.menu_item_id || opt.employee_id || opt.id;
                  const label = opt.ingredient_name || opt.name || `${opt.first_name} ${opt.last_name}` || id;
                  return <option key={id} value={id}>{label}</option>;
                })}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                step={field.step}
                value={formData[field.name] || ''}
                onChange={handleFormChange}
                disabled={field.disabled || (mode === 'edit' && field.name.includes('id')) || (activeTab === 'ingredients' && mode === 'edit' && field.name === 'ingredient_name')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all disabled:bg-gray-100 disabled:text-gray-500"
              />
            )}
          </div>
        ))}

        {activeTab === 'menu-items' && (
          <div className="border-t-4 border-gray-300 pt-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-amber-900">Recipe Ingredients</h3>
              <SecondaryButton
                onClick={addIngredient}
                icon={Plus}
                className="text-sm"
              >
                Add Ingredient
              </SecondaryButton>
            </div>

            <div className="space-y-4">
              {selectedIngredients.map((ing, idx) => {
                const selectedIng = ingredients.find(i => i.ingredient_id === ing.ingredient_id);
                return (
                  <div key={idx} className="flex gap-3 items-center bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border-3 border-gray-300 hover:border-amber-400 transition-colors">
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) => updateIngredient(idx, 'ingredient_id', e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white"
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

                    <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-gray-300">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                        className="w-24 px-2 py-1 border-0 focus:ring-0 text-center font-semibold"
                      />
                      {selectedIng && (
                        <span className="text-sm font-bold text-amber-700 ml-2 whitespace-nowrap">
                          {selectedIng.unit}
                        </span>
                      )}
                    </div>

                    <IconButton
                      onClick={() => removeIngredient(idx)}
                      icon={Trash2}
                      variant="danger"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-10">
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

// ===== REPORT MODAL (The Form) =====
function ReportModal({ type, onClose, zReportLastRunDate, setZReportLastRunDate }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderId, setOrderId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type === 'low-stock' || type === 'x-report' || type === 'z-report') {
      generateReport();
    }
  }, [type]);

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      if (type === 'sales') {
        alert('Sales Report: ' + startDate + ' to ' + endDate);
      } else if (type === 'product-usage') {
        alert('Product Usage Report: ' + startDate + ' to ' + endDate);
      } else if (type === 'low-stock') {
        const res = await fetch(`${API_BASE}/ingredients/`);
        if (!res.ok) throw new Error('Failed to fetch ingredients');
        const ingredients = await res.json();
        const lowStock = ingredients.filter(i => i.stock_level <= i.low_stock_threshold);
        setReportData(lowStock);
      } else if (type === 'x-report') {
        const today = new Date().toISOString().split('T')[0];
        if (today === zReportLastRunDate) {
          alert('Z-Report has been run for today. No further X-Report data.');
        } else {
          alert('X-Report for ' + today);
          setReportData({ title: 'X-Report (Hourly Sales)', generated: new Date().toLocaleString() });
        }
      } else if (type === 'z-report') {
        const today = new Date().toISOString().split('T')[0];
        if (today === zReportLastRunDate) {
          alert('Z-Report has already been run for today.');
        } else {
          if (confirm('Run End-of-Day Z-Report? This should only be done once per day.')) {
            setZReportLastRunDate(today);
            alert('Z-Report generated for ' + today);
            setReportData({ title: 'Z-Report (End of Day)', generated: new Date().toLocaleString() });
          }
        }
      } else if (type === 'void-order') {
        if (orderId) {
          if (confirm(`Are you sure you want to void order #${orderId}?`)) {
            alert('Order voided: ' + orderId);
          }
        } else {
          alert('Please enter an Order ID.');
        }
      }
    } catch (err) {
      alert('Error generating report: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      {(type === 'sales' || type === 'product-usage') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-amber-900 mb-3">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.g.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-amber-900 mb-3">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
        </div>
      )}

      {type === 'void-order' && (
        <div className="mb-8">
          <label className="block text-sm font-bold text-amber-900 mb-3">Order ID</label>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID to void"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
          />
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="text-gray-600 mt-4 font-semibold">Generating report...</p>
        </div>
      )}

      {reportData && type === 'low-stock' && (
        <div className="mt-6">
          <h3 className="text-xl font-bold text-amber-900 mb-6">⚠️ Low Stock Items</h3>
          {reportData.length > 0 ? (
            <div className="overflow-x-auto border-4 border-orange-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-b-4 border-red-600">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">Ingredient</th>
                    <th className="px-6 py-4 text-center font-bold">Stock Level</th>
                    <th className="px-6 py-4 text-center font-bold">Threshold</th>
                    <th className="px-6 py-4 text-left font-bold">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="border-b-2 border-gray-200 hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-700">{item.ingredient_name}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600 text-lg">{item.stock_level}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.low_stock_threshold}</td>
                      <td className="px-6 py-4 text-gray-700">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-green-50 border-4 border-green-300 rounded-lg p-6">
              <p className="text-green-800 font-bold text-lg">✅ All items are in stock!</p>
            </div>
          )}
        </div>
      )}

      {reportData && (type === 'x-report' || type === 'z-report') && (
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 border-4 border-blue-400">
          <h3 className="text-2xl font-bold text-blue-900 mb-3">{reportData.title}</h3>
          <p className="text-blue-700 font-semibold">Generated at: {reportData.generated}</p>
        </div>
      )}

      <div className="flex gap-4 mt-10">
        {(type === 'sales' || type === 'product-usage' || type === 'void-order') && (
          <SecondaryButton
            onClick={generateReport}
            disabled={loading}
            icon={FileText}
            className="flex-1"
            variant="info"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </SecondaryButton>
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

export default BobaManager;