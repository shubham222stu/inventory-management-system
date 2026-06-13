import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Data States
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  })
  
  // Loading & Error States
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState([])

  // Search States
  const [searchQuery, setSearchQuery] = useState('')

  // Modals States
  const [productModal, setProductModal] = useState({ open: false, mode: 'create', data: null })
  const [customerModal, setCustomerModal] = useState({ open: false })
  const [orderModal, setOrderModal] = useState({ open: false })
  const [orderDetailModal, setOrderDetailModal] = useState({ open: false, data: null })

  // Form States
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', quantity: '' })
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '' })
  const [orderCustomerId, setOrderCustomerId] = useState('')
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }])

  // Toast helper
  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Fetch functions
  const fetchDashboardSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`)
      if (!res.ok) throw new Error("Failed to fetch dashboard statistics.")
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`)
      if (!res.ok) throw new Error("Failed to fetch products.")
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`)
      if (!res.ok) throw new Error("Failed to fetch customers.")
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`)
      if (!res.ok) throw new Error("Failed to fetch orders.")
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Refresh all state
  const refreshData = async () => {
    setLoading(true)
    await Promise.all([
      fetchDashboardSummary(),
      fetchProducts(),
      fetchCustomers(),
      fetchOrders()
    ])
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Product Submit (Create & Update)
  const handleProductSubmit = async (e) => {
    e.preventDefault()
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.quantity) {
      addToast("Please fill in all product fields.", "warning")
      return
    }

    const priceNum = parseFloat(productForm.price)
    const qtyNum = parseInt(productForm.quantity)

    if (isNaN(priceNum) || priceNum < 0) {
      addToast("Price must be a positive number.", "warning")
      return
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      addToast("Quantity cannot be negative.", "warning")
      return
    }

    const payload = {
      name: productForm.name,
      sku: productForm.sku,
      price: priceNum,
      quantity: qtyNum
    }

    try {
      let res
      if (productModal.mode === 'create') {
        res = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${API_BASE_URL}/products/${productModal.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error saving product.")

      addToast(`Product '${data.name}' saved successfully!`, 'success')
      setProductModal({ open: false, mode: 'create', data: null })
      setProductForm({ name: '', sku: '', price: '', quantity: '' })
      refreshData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete product '${name}'?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error deleting product.")
      addToast(data.message || "Product deleted.", 'success')
      refreshData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Customer Submit
  const handleCustomerSubmit = async (e) => {
    e.preventDefault()
    if (!customerForm.name || !customerForm.email) {
      addToast("Please fill in at least Name and Email.", "warning")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error registering customer.")

      addToast(`Customer '${data.name}' added successfully!`, 'success')
      setCustomerModal({ open: false })
      setCustomerForm({ name: '', email: '', phone: '' })
      refreshData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Delete Customer
  const handleDeleteCustomer = async (id, name) => {
    if (!confirm(`Are you sure you want to delete customer '${name}'?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error deleting customer.")
      addToast(data.message || "Customer deleted.", 'success')
      refreshData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Order Item builders
  const addOrderItemRow = () => {
    setOrderItems(prev => [...prev, { product_id: '', quantity: 1 }])
  }

  const removeOrderItemRow = (index) => {
    if (orderItems.length === 1) return
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateOrderItemRow = (index, field, value) => {
    setOrderItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Calculate total price in frontend real-time (preview)
  const calculatePreviewTotal = () => {
    return orderItems.reduce((acc, item) => {
      if (!item.product_id) return acc
      const prod = products.find(p => p.id === parseInt(item.product_id))
      return acc + (prod ? prod.price * (parseInt(item.quantity) || 0) : 0)
    }, 0)
  }

  // Submit Order
  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    if (!orderCustomerId) {
      addToast("Please select a customer.", "warning")
      return
    }
    
    // Validate rows
    const cleanedItems = orderItems.map(item => ({
      product_id: parseInt(item.product_id),
      quantity: parseInt(item.quantity)
    }))

    if (cleanedItems.some(i => !i.product_id || isNaN(i.quantity) || i.quantity <= 0)) {
      addToast("Please select valid products and positive quantities.", "warning")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(orderCustomerId),
          items: cleanedItems
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error creating order.")

      addToast(`Order #${data.id} placed successfully!`, 'success')
      setOrderModal({ open: false })
      setOrderCustomerId('')
      setOrderItems([{ product_id: '', quantity: 1 }])
      refreshData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Delete/Cancel Order
  const handleDeleteOrder = async (id) => {
    if (!confirm(`Are you sure you want to cancel/delete order #${id}? This will restore product stock.`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error cancelling order.")
      addToast(data.message || "Order deleted.", 'success')
      refreshData()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // Open modals helper
  const openEditProductModal = (prod) => {
    setProductForm({ name: prod.name, sku: prod.sku, price: prod.price, quantity: prod.quantity })
    setProductModal({ open: true, mode: 'edit', data: prod })
  }

  // Filters logic
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOrders = orders.filter(o => 
    o.id.toString().includes(searchQuery) ||
    o.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="app-container">
      
      {/* Toast Alert System */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'error' && <AlertTriangle size={18} />}
            {t.type === 'warning' && <AlertTriangle size={18} />}
            {t.type === 'info' && <Info size={18} />}
            <span className="toast-message">{t.message}</span>
            <X size={14} className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <ShoppingCart size={28} className="logo-icon" color="#6366f1" />
          <span className="logo-text">StockFlow</span>
        </div>
        <ul className="nav-links">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
          </li>
          <li className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('products'); setSearchQuery(''); }}>
              <Package size={20} />
              <span>Products</span>
            </button>
          </li>
          <li className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}>
              <Users size={20} />
              <span>Customers</span>
            </button>
          </li>
          <li className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}>
              <ShoppingCart size={20} />
              <span>Orders</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main View Shell */}
      <main className="main-content">
        
        {/* VIEW: Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Business Dashboard</h1>
                <p>Real-time analytics and inventory health tracker</p>
              </div>
              <button className="btn btn-secondary" onClick={refreshData} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Stats'}
              </button>
            </div>

            {/* Metrics cards grid */}
            <div className="dashboard-grid">
              <div className="glass-card stat-card">
                <div className="stat-info">
                  <h3>Total Products</h3>
                  <div className="stat-value">{summary.total_products}</div>
                </div>
                <div className="stat-icon primary"><Package size={26} /></div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-info">
                  <h3>Total Customers</h3>
                  <div className="stat-value">{summary.total_customers}</div>
                </div>
                <div className="stat-icon success"><UserCheck size={26} /></div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-info">
                  <h3>Total Orders</h3>
                  <div className="stat-value">{summary.total_orders}</div>
                </div>
                <div className="stat-icon secondary"><ShoppingCart size={26} /></div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-info">
                  <h3>Low Stock Alerts</h3>
                  <div className="stat-value">{summary.low_stock_products.length}</div>
                </div>
                <div className="stat-icon warning"><AlertTriangle size={26} /></div>
              </div>
            </div>

            {/* Low stock table details */}
            <div className="glass-card low-stock-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle color="#f59e0b" /> Low Stock Warning Items
              </h2>
              {summary.low_stock_products.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>All products are healthy and adequately stocked.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Quantity Left</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.low_stock_products.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: '500' }}>{p.name}</td>
                          <td><code>{p.sku}</code></td>
                          <td>${p.price.toFixed(2)}</td>
                          <td style={{ color: p.quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: '600' }}>
                            {p.quantity} units
                          </td>
                          <td>
                            <span className={`badge ${p.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                              {p.quantity === 0 ? 'Out of stock' : 'Low stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Products */}
        {activeTab === 'products' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Product Management</h1>
                <p>Create, update, and manage your inventory catalog</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setProductForm({ name: '', sku: '', price: '', quantity: '' })
                  setProductModal({ open: true, mode: 'create', data: null })
                }}
              >
                <Plus size={18} /> Add Product
              </button>
            </div>

            {/* Search and Table */}
            <div className="glass-card">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search products by name or SKU..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  No products found. Add products to populate the list.
                </p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product Name</th>
                        <th>SKU Code</th>
                        <th>Price</th>
                        <th>Stock Qty</th>
                        <th>Availability</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td>#{p.id}</td>
                          <td style={{ fontWeight: '500' }}>{p.name}</td>
                          <td><code>{p.sku}</code></td>
                          <td>${p.price.toFixed(2)}</td>
                          <td>{p.quantity}</td>
                          <td>
                            <span className={`badge ${p.quantity > 5 ? 'badge-success' : p.quantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                              {p.quantity > 5 ? 'In Stock' : p.quantity > 0 ? 'Low Stock' : 'Out Of Stock'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon edit" title="Edit Product" onClick={() => openEditProductModal(p)}>
                                <Edit3 size={16} />
                              </button>
                              <button className="btn-icon delete" title="Delete Product" onClick={() => handleDeleteProduct(p.id, p.name)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Customers */}
        {activeTab === 'customers' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Customer Relations</h1>
                <p>Register new clients and view purchase credentials</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setCustomerModal({ open: true })}
              >
                <Plus size={18} /> Add Customer
              </button>
            </div>

            {/* Search and Table */}
            <div className="glass-card">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search customers by name or email..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredCustomers.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  No customers found. Register customers to begin ordering.
                </p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Email Address</th>
                        <th>Phone Number</th>
                        <th>Registered Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(c => (
                        <tr key={c.id}>
                          <td>#{c.id}</td>
                          <td style={{ fontWeight: '500' }}>{c.name}</td>
                          <td>{c.email}</td>
                          <td>{c.phone || '-'}</td>
                          <td>{new Date(c.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon delete" title="Delete Customer" onClick={() => handleDeleteCustomer(c.id, c.name)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: Orders */}
        {activeTab === 'orders' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Order Fulfillment</h1>
                <p>Process customer orders and cancel logs</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setOrderModal({ open: true })}
              >
                <Plus size={18} /> Create Order
              </button>
            </div>

            {/* Search and Table */}
            <div className="glass-card">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search orders by customer or ID..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  No orders found. Create orders to log transactional histories.
                </p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Ordered Items Count</th>
                        <th>Total Amount</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: '600' }}>#{o.id}</td>
                          <td style={{ fontWeight: '500' }}>{o.customer.name}</td>
                          <td>{o.items.reduce((sum, item) => sum + item.quantity, 0)} items</td>
                          <td style={{ color: 'var(--color-secondary)', fontWeight: '600' }}>
                            ${o.total_amount.toFixed(2)}
                          </td>
                          <td>{new Date(o.created_at).toLocaleString()}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon edit" title="View Order Details" onClick={() => setOrderDetailModal({ open: true, data: o })}>
                                <Eye size={16} />
                              </button>
                              <button className="btn-icon delete" title="Cancel/Delete Order" onClick={() => handleDeleteOrder(o.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: Product Create/Edit */}
      {productModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{productModal.mode === 'create' ? 'Create New Product' : 'Modify Product'}</h2>
              <button className="btn-icon" onClick={() => setProductModal({ open: false, mode: 'create', data: null })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Mechanical Keyboard"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SKU / Reference Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. KB-MECH-87"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($ USD)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-control" 
                      placeholder="99.99"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Stock Quantity</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="50"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setProductModal({ open: false, mode: 'create', data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {productModal.mode === 'create' ? 'Create Product' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Customer Register */}
      {customerModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Register New Customer</h2>
              <button className="btn-icon" onClick={() => setCustomerModal({ open: false })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Customer Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Jane Doe"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="jane.doe@example.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="+1 (555) 123-4567"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCustomerModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Order */}
      {orderModal.open && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>Place Customer Order</h2>
              <button className="btn-icon" onClick={() => setOrderModal({ open: false })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="modal-body">
                {/* Select Customer */}
                <div className="form-group">
                  <label>Select Customer Reference</label>
                  <select 
                    className="form-control" 
                    value={orderCustomerId} 
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    required
                    style={{ background: 'var(--bg-primary)' }}
                  >
                    <option value="">-- Choose registered customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                {/* Items Builder */}
                <label className="form-group label" style={{ display: 'block', marginBottom: '0.5rem' }}>Ordered Items</label>
                <div className="order-items-builder">
                  {orderItems.map((item, index) => {
                    const selectedProd = products.find(p => p.id === parseInt(item.product_id))
                    const maxStock = selectedProd ? selectedProd.quantity : 0
                    const qtyWarning = selectedProd && parseInt(item.quantity) > maxStock

                    return (
                      <div className="order-item-row" key={index}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product</label>
                          <select 
                            className="form-control"
                            value={item.product_id}
                            onChange={(e) => updateOrderItemRow(index, 'product_id', e.target.value)}
                            required
                            style={{ background: 'var(--bg-primary)' }}
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (${p.price.toFixed(2)}) - [Stock: {p.quantity}]
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity</label>
                          <input 
                            type="number" 
                            min="1" 
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => updateOrderItemRow(index, 'quantity', e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ paddingBottom: '0.55rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Total: ${selectedProd ? (selectedProd.price * (parseInt(item.quantity) || 0)).toFixed(2) : '0.00'}
                        </div>
                        <div>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '0.65rem 0.75rem', color: 'var(--color-danger)' }}
                            onClick={() => removeOrderItemRow(index)}
                            disabled={orderItems.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                        
                        {/* Stock validation warning */}
                        {qtyWarning && (
                          <div style={{ gridColumn: '1 / span 4', color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '-0.5rem' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Warning: Quantity exceeds available stock ({maxStock} units remaining).
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={addOrderItemRow} 
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    + Add Another Product
                  </button>
                </div>

                <div className="order-item-total">
                  Total Order Amount: <span style={{ color: 'var(--color-secondary)' }}>${calculatePreviewTotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOrderModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Order Details */}
      {orderDetailModal.open && orderDetailModal.data && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>Order Details - #{orderDetailModal.data.id}</h2>
              <button className="btn-icon" onClick={() => setOrderDetailModal({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Customer summary */}
              <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Customer Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                  <div><strong>Name:</strong> {orderDetailModal.data.customer.name}</div>
                  <div><strong>Email:</strong> {orderDetailModal.data.customer.email}</div>
                  <div><strong>Phone:</strong> {orderDetailModal.data.customer.phone || 'N/A'}</div>
                  <div><strong>Placed On:</strong> {new Date(orderDetailModal.data.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Items Table */}
              <h3 style={{ marginBottom: '0.75rem' }}>Purchased Items</h3>
              <div className="table-container" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price at Order</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetailModal.data.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.product ? item.product.name : 'Unknown Product'}</td>
                        <td><code>{item.product ? item.product.sku : 'N/A'}</code></td>
                        <td>{item.quantity} units</td>
                        <td>${item.price_at_order.toFixed(2)}</td>
                        <td style={{ fontWeight: '600' }}>
                          ${(item.quantity * item.price_at_order).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-item-total" style={{ marginTop: '1.5rem' }}>
                Total Paid Amount: <span style={{ color: 'var(--color-secondary)' }}>${orderDetailModal.data.total_amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setOrderDetailModal({ open: false, data: null })}>
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
