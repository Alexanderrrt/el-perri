"use client";
import { useState, useEffect } from "react";
import { listUsers, deleteUserById } from "@/lib/userStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [notification, setNotification] = useState(null);

  const [menuItems, setMenuItems] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", description: "" });

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [inventory, setInventory] = useState([]);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({ name: "", quantity: "", unit: "", minStock: "" });

  const [staff, setStaff] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", role: "", phone: "" });

  const [promotions, setPromotions] = useState([]);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: "", discount: "", type: "percent", expiry: "" });

  const [settings, setSettings] = useState({
    name: "El Perri Latin Food",
    phone: "(555) 123-4567",
    address: "1358 S Winchester Blvd",
    hours: "12pm - 11pm Daily"
  });

  useEffect(() => {
    const authData = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : null;
    if (authData) setAdmin(JSON.parse(authData));
    loadAllData();
    refreshUsers();

    // Real-time: when a guest signs up on ANY device, update the table live
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel("registered_users_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "registered_users" },
          () => refreshUsers()
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, []);

  const loadAllData = () => {
    if (typeof window === "undefined") return;
    const items = localStorage.getItem("menuItems");
    const ordr = localStorage.getItem("orders");
    const cust = localStorage.getItem("customers");
    const inv = localStorage.getItem("inventory");
    const stf = localStorage.getItem("staff");
    const promo = localStorage.getItem("promotions");

    if (items) setMenuItems(JSON.parse(items));
    if (ordr) setOrders(JSON.parse(ordr));
    if (cust) setCustomers(JSON.parse(cust));
    if (inv) setInventory(JSON.parse(inv));
    if (stf) setStaff(JSON.parse(stf));
    if (promo) setPromotions(JSON.parse(promo));
  };

  const refreshUsers = async () => {
    try {
      setUsers(await listUsers());
    } catch (err) {
      notify("Could not load users: " + err.message, "error");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteUserById(userId);
      await refreshUsers();
      notify("User deleted", "success");
    } catch (err) {
      notify("Delete failed: " + err.message, "error");
    }
  };

  const exportUsersCSV = () => {
    if (users.length === 0) {
      notify("No users to export", "error");
      return;
    }
    const headers = ["Email", "Name", "Newsletter", "Signed Up"];
    const rows = users.map(u => [
      u.email,
      u.name || "N/A",
      u.newsletter ? "Yes" : "No",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `el-perri-users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Exported ${users.length} users for marketing`, "success");
  };

  const exportEmailsOnly = () => {
    if (users.length === 0) {
      notify("No users to export", "error");
      return;
    }
    const emails = users.map(u => u.email).join(", ");
    navigator.clipboard.writeText(emails).then(() => {
      notify(`Copied ${users.length} emails to clipboard`, "success");
    }).catch(() => {
      notify("Could not copy to clipboard", "error");
    });
  };

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveMenu = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("menuItems", JSON.stringify(items));
    setMenuItems(items);
  };

  const handleAddMenu = () => {
    if (!menuForm.name || !menuForm.price) {
      notify("Name and price are required", "error");
      return;
    }
    if (editingId) {
      const updated = menuItems.map(m => m.id === editingId ? { ...menuForm, id: editingId } : m);
      saveMenu(updated);
      notify("Menu item updated successfully", "success");
      setEditingId(null);
    } else {
      saveMenu([...menuItems, { ...menuForm, id: Date.now() }]);
      notify("Menu item added successfully", "success");
    }
    setMenuForm({ name: "", category: "", price: "", description: "" });
    setShowAddMenu(false);
  };

  const deleteMenu = (id) => {
    saveMenu(menuItems.filter(m => m.id !== id));
    notify("Menu item deleted", "success");
  };
  const editMenu = (item) => {
    setMenuForm(item);
    setEditingId(item.id);
    setShowAddMenu(true);
    notify("Editing menu item", "info");
  };

  const saveInventory = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("inventory", JSON.stringify(items));
    setInventory(items);
  };

  const handleAddInventory = () => {
    if (!inventoryForm.name || !inventoryForm.quantity) {
      alert("Name and quantity required");
      return;
    }
    saveInventory([...inventory, { ...inventoryForm, id: Date.now() }]);
    setInventoryForm({ name: "", quantity: "", unit: "", minStock: "" });
    setShowAddInventory(false);
  };

  const deleteInventory = (id) => saveInventory(inventory.filter(i => i.id !== id));

  const saveStaff = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("staff", JSON.stringify(items));
    setStaff(items);
  };

  const handleAddStaff = () => {
    if (!staffForm.name || !staffForm.email) {
      alert("Name and email required");
      return;
    }
    saveStaff([...staff, { ...staffForm, id: Date.now() }]);
    setStaffForm({ name: "", email: "", role: "", phone: "" });
    setShowAddStaff(false);
  };

  const deleteStaff = (id) => saveStaff(staff.filter(s => s.id !== id));

  const savePromo = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("promotions", JSON.stringify(items));
    setPromotions(items);
  };

  const handleAddPromo = () => {
    if (!promoForm.code || !promoForm.discount) {
      alert("Code and discount required");
      return;
    }
    savePromo([...promotions, { ...promoForm, id: Date.now() }]);
    setPromoForm({ code: "", discount: "", type: "percent", expiry: "" });
    setShowAddPromo(false);
  };

  const deletePromo = (id) => savePromo(promotions.filter(p => p.id !== id));

  const handleOrderStatus = (id, status) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    if (typeof window !== "undefined") localStorage.setItem("orders", JSON.stringify(updated));
    setOrders(updated);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockItems = inventory.filter(i => parseInt(i.quantity) <= parseInt(i.minStock || 0));

  return (
    <div className="admin-dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      <nav className="admin-nav">
        <div className="admin-nav-brand"><h1>El Perri Admin</h1></div>
        <button className="btn-logout" onClick={() => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("adminAuth");
            window.location.href = "/admin/login";
          }
        }}>Logout</button>
      </nav>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>📋 Menu</button>
        <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>📦 Orders</button>
        <button className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
        <button className={`tab-btn ${activeTab === "customers" ? "active" : ""}`} onClick={() => setActiveTab("customers")}>👥 Customers</button>
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>📧 Users & Marketing</button>
        <button className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>📦 Inventory</button>
        <button className={`tab-btn ${activeTab === "staff" ? "active" : ""}`} onClick={() => setActiveTab("staff")}>👔 Staff</button>
        <button className={`tab-btn ${activeTab === "promotions" ? "active" : ""}`} onClick={() => setActiveTab("promotions")}>🎁 Promotions</button>
        <button className={`tab-btn ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>⚙️ Settings</button>
      </div>

      <main className="admin-main">
        {activeTab === "menu" && (
          <div>
            <div className="section-header">
              <h2>Menu Management</h2>
              <button className="btn btn-gold" onClick={() => {
                setShowAddMenu(!showAddMenu);
                setEditingId(null);
                setMenuForm({ name: "", category: "", price: "", description: "" });
              }}>{showAddMenu ? "Cancel" : "+ Add Item"}</button>
            </div>
            {showAddMenu && (
              <div className="form-section">
                <input placeholder="Item name" value={menuForm.name} onChange={(e) => setMenuForm({...menuForm, name: e.target.value})} />
                <input placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm({...menuForm, category: e.target.value})} />
                <input placeholder="Price" type="number" step="0.01" value={menuForm.price} onChange={(e) => setMenuForm({...menuForm, price: e.target.value})} />
                <textarea placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}></textarea>
                <button className="btn btn-gold" onClick={handleAddMenu}>{editingId ? "Update" : "Add"} Item</button>
              </div>
            )}
            <div className="items-grid">
              {menuItems.length === 0 ? (
                <p className="empty-state">No menu items yet</p>
              ) : (
                menuItems.map(item => (
                  <div key={item.id} className="item-card">
                    <strong>{item.name}</strong>
                    <p className="category">{item.category}</p>
                    <p className="price">${parseFloat(item.price).toFixed(2)}</p>
                    <p className="desc">{item.description}</p>
                    <div className="actions">
                      <button className="btn btn-small" onClick={() => editMenu(item)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => deleteMenu(item.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2>Order Management</h2>
            {orders.length === 0 ? (
              <p className="empty-state">No orders yet</p>
            ) : (
              <div className="cards-grid">
                {orders.map(order => (
                  <div key={order.id} className="card">
                    <strong>Order #{order.id}</strong>
                    <p>{order.customer} • ${order.total}</p>
                    <select value={order.status} onChange={(e) => handleOrderStatus(order.id, e.target.value)}>
                      <option>pending</option>
                      <option>preparing</option>
                      <option>ready</option>
                      <option>completed</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2>Analytics & Reports</h2>
            <div className="stats-grid">
              <div className="stat"><h3>Total Orders</h3><p className="value">{orders.length}</p></div>
              <div className="stat"><h3>Revenue</h3><p className="value">${totalRevenue.toFixed(2)}</p></div>
              <div className="stat"><h3>Menu Items</h3><p className="value">{menuItems.length}</p></div>
              <div className="stat"><h3>Staff</h3><p className="value">{staff.length}</p></div>
            </div>
            {lowStockItems.length > 0 && <div className="alert alert-warning">⚠️ {lowStockItems.length} items low on stock</div>}
          </div>
        )}

        {activeTab === "customers" && (
          <div>
            <h2>Customer Management</h2>
            {customers.length === 0 ? (
              <p className="empty-state">No customers yet</p>
            ) : (
              <div className="cards-grid">
                {customers.map(cust => (
                  <div key={cust.id} className="card"><strong>{cust.name}</strong><p>{cust.email}</p><p className="small">Orders: {cust.orders}</p></div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="section-header">
              <h2>Users & Marketing {isSupabaseConfigured && <span className="live-badge">● LIVE</span>}</h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-small" onClick={refreshUsers}>🔄 Refresh</button>
                <button className="btn btn-small" onClick={exportEmailsOnly}>📋 Copy Emails</button>
                <button className="btn btn-gold" onClick={exportUsersCSV}>⬇ Export CSV</button>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <div className="stat"><h3>Total Users</h3><p className="value">{users.length}</p></div>
              <div className="stat"><h3>Newsletter Opt-In</h3><p className="value">{users.filter(u => u.newsletter).length}</p></div>
              <div className="stat"><h3>This Week</h3><p className="value">{users.filter(u => u.createdAt && (Date.now() - new Date(u.createdAt).getTime()) < 7 * 864e5).length}</p></div>
            </div>

            <input
              placeholder="Search by email or name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: "100%", maxWidth: "400px", marginBottom: "1.5rem", background: "#0a0a0a", border: "1px solid rgba(255,215,0,0.2)", color: "#fff", padding: "0.75rem", borderRadius: "4px" }}
            />

            {users.length === 0 ? (
              <p className="empty-state">No registered users yet. When guests sign up via the welcome bubble, they appear here.</p>
            ) : (
              <div className="user-table">
                <div className="user-row user-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Newsletter</span>
                  <span>Joined</span>
                  <span></span>
                </div>
                {users
                  .filter(u =>
                    !userSearch ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                    (u.name || "").toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map(user => (
                    <div key={user.userId} className="user-row">
                      <span><strong>{user.name}</strong></span>
                      <span>{user.email}</span>
                      <span>{user.newsletter ? "✅ Yes" : "—"}</span>
                      <span className="small">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                      <span><button className="btn btn-small btn-danger" onClick={() => deleteUser(user.userId)}>Delete</button></span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "inventory" && (
          <div>
            <div className="section-header">
              <h2>Inventory Management</h2>
              <button className="btn btn-gold" onClick={() => setShowAddInventory(!showAddInventory)}>{showAddInventory ? "Cancel" : "+ Add Item"}</button>
            </div>
            {showAddInventory && (
              <div className="form-section">
                <input placeholder="Item name" value={inventoryForm.name} onChange={(e) => setInventoryForm({...inventoryForm, name: e.target.value})} />
                <input placeholder="Quantity" type="number" value={inventoryForm.quantity} onChange={(e) => setInventoryForm({...inventoryForm, quantity: e.target.value})} />
                <input placeholder="Unit (kg, L, pcs)" value={inventoryForm.unit} onChange={(e) => setInventoryForm({...inventoryForm, unit: e.target.value})} />
                <input placeholder="Min Stock Alert" type="number" value={inventoryForm.minStock} onChange={(e) => setInventoryForm({...inventoryForm, minStock: e.target.value})} />
                <button className="btn btn-gold" onClick={handleAddInventory}>Add Item</button>
              </div>
            )}
            <div className="cards-grid">
              {inventory.length === 0 ? (
                <p className="empty-state">No inventory items</p>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className={`card ${parseInt(item.quantity) <= parseInt(item.minStock || 0) ? "low-stock" : ""}`}>
                    <strong>{item.name}</strong>
                    <p>{item.quantity} {item.unit}</p>
                    <p className="small">Min: {item.minStock}</p>
                    <button className="btn btn-small btn-danger" onClick={() => deleteInventory(item.id)}>Delete</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "staff" && (
          <div>
            <div className="section-header">
              <h2>Staff Management</h2>
              <button className="btn btn-gold" onClick={() => setShowAddStaff(!showAddStaff)}>{showAddStaff ? "Cancel" : "+ Add Staff"}</button>
            </div>
            {showAddStaff && (
              <div className="form-section">
                <input placeholder="Full name" value={staffForm.name} onChange={(e) => setStaffForm({...staffForm, name: e.target.value})} />
                <input placeholder="Email" type="email" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} />
                <input placeholder="Role (Manager, Chef, Waiter)" value={staffForm.role} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})} />
                <input placeholder="Phone" value={staffForm.phone} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} />
                <button className="btn btn-gold" onClick={handleAddStaff}>Add Staff</button>
              </div>
            )}
            <div className="cards-grid">
              {staff.length === 0 ? (
                <p className="empty-state">No staff members</p>
              ) : (
                staff.map(member => (
                  <div key={member.id} className="card">
                    <strong>{member.name}</strong>
                    <p className="role">{member.role}</p>
                    <p className="small">{member.email}</p>
                    <p className="small">{member.phone}</p>
                    <button className="btn btn-small btn-danger" onClick={() => deleteStaff(member.id)}>Delete</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "promotions" && (
          <div>
            <div className="section-header">
              <h2>Promotions & Discounts</h2>
              <button className="btn btn-gold" onClick={() => setShowAddPromo(!showAddPromo)}>{showAddPromo ? "Cancel" : "+ Add Promo"}</button>
            </div>
            {showAddPromo && (
              <div className="form-section">
                <input placeholder="Code (SUMMER20)" value={promoForm.code} onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
                <input placeholder="Discount" type="number" step="0.01" value={promoForm.discount} onChange={(e) => setPromoForm({...promoForm, discount: e.target.value})} />
                <select value={promoForm.type} onChange={(e) => setPromoForm({...promoForm, type: e.target.value})}>
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
                <input placeholder="Expiry date" type="date" value={promoForm.expiry} onChange={(e) => setPromoForm({...promoForm, expiry: e.target.value})} />
                <button className="btn btn-gold" onClick={handleAddPromo}>Add Promo</button>
              </div>
            )}
            <div className="cards-grid">
              {promotions.length === 0 ? (
                <p className="empty-state">No promotions</p>
              ) : (
                promotions.map(promo => (
                  <div key={promo.id} className="card">
                    <strong>{promo.code}</strong>
                    <p className="discount">{promo.discount}{promo.type === "percent" ? "%" : "$"} off</p>
                    <p className="small">Expires: {promo.expiry}</p>
                    <button className="btn btn-small btn-danger" onClick={() => deletePromo(promo.id)}>Delete</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h2>Restaurant Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Restaurant Name</label>
                <input value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hours</label>
                <input value={settings.hours} onChange={(e) => setSettings({...settings, hours: e.target.value})} />
              </div>
              <button className="btn btn-gold" onClick={() => {
                if (typeof window !== "undefined") localStorage.setItem("settings", JSON.stringify(settings));
                alert("Settings saved!");
              }}>Save Changes</button>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        }
        .notification-success {
          background: #4caf50;
          color: #fff;
          border-left: 4px solid #45a049;
        }
        .notification-error {
          background: #ff4444;
          color: #fff;
          border-left: 4px solid #cc0000;
        }
        .notification-info {
          background: #2196f3;
          color: #fff;
          border-left: 4px solid #0b7dda;
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .admin-dashboard { display: flex; flex-direction: column; min-height: 100vh; background: #0a0a0a; color: #fff; }
        .admin-nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; background: #1a1a1a; border-bottom: 1px solid rgba(255,215,0,0.1); }
        .admin-nav-brand h1 { margin: 0; color: #ffd700; }
        .admin-tabs { display: flex; gap: 0.5rem; padding: 1rem 2rem; background: #1a1a1a; border-bottom: 1px solid rgba(255,215,0,0.1); flex-wrap: wrap; }
        .tab-btn { padding: 0.75rem 1rem; background: transparent; border: 1px solid rgba(255,215,0,0.2); color: rgba(255,255,255,0.7); border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { background: #ffd700; color: #000; border-color: #ffd700; }
        .tab-btn:hover { border-color: #ffd700; color: #ffd700; }
        .admin-main { flex: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .form-section { background: #1a1a1a; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .form-section input, .form-section textarea, .form-section select { background: #0a0a0a; border: 1px solid rgba(255,215,0,0.2); color: #fff; padding: 0.75rem; border-radius: 4px; font-family: inherit; font-size: 1rem; }
        .form-section textarea { min-height: 80px; }
        .items-grid, .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
        .item-card, .card { background: #1a1a1a; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; padding: 1.5rem; }
        .item-card strong, .card strong { color: #ffd700; }
        .category { color: rgba(255,215,0,0.6); font-size: 0.9rem; margin: 0; }
        .price { color: #ffd700; font-weight: bold; font-size: 1.2rem; margin: 0; }
        .desc { color: rgba(255,255,255,0.6); font-size: 0.85rem; line-height: 1.3; }
        .card.low-stock { border-color: #ff6b6b; background: rgba(255,107,107,0.1); }
        .role { color: rgba(255,215,0,0.6); margin: 0.5rem 0; }
        .discount { color: #4caf50; font-weight: bold; margin: 0.5rem 0; }
        .small { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0.25rem 0; }
        .card select { width: 100%; padding: 0.5rem; background: #0a0a0a; border: 1px solid rgba(255,215,0,0.2); color: #fff; border-radius: 4px; margin-top: 0.5rem; cursor: pointer; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat { background: #1a1a1a; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; padding: 1.5rem; text-align: center; }
        .stat h3 { margin: 0 0 1rem 0; color: #ffd700; text-transform: uppercase; font-size: 0.9rem; }
        .stat .value { margin: 0; font-size: 2.5rem; font-weight: bold; color: #ffd700; }
        .alert { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid; }
        .alert-warning { background: rgba(255,193,7,0.1); border-left-color: #ffc107; color: #ffc107; }
        .settings-form { display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-weight: 600; color: #ffd700; font-size: 0.9rem; }
        .form-group input { background: #0a0a0a; border: 1px solid rgba(255,215,0,0.2); color: #fff; padding: 0.75rem; border-radius: 4px; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600; border: none; font-size: 1rem; transition: all 0.2s; }
        .btn-gold { background: #ffd700; color: #000; }
        .btn-gold:hover { background: #ffed4e; transform: translateY(-2px); }
        .btn-logout { padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600; border: 1px solid rgba(255,215,0,0.3); background: transparent; color: #ffd700; font-size: 1rem; }
        .btn-small { padding: 0.5rem 1rem; font-size: 0.875rem; background: #ffd700; color: #000; }
        .btn-small:hover { background: #ffed4e; }
        .btn-danger { background: #ff4444; color: #fff; }
        .btn-danger:hover { background: #ff6666; }
        .actions { display: flex; gap: 0.5rem; margin-top: auto; }
        .empty-state { text-align: center; color: rgba(255,255,255,0.5); padding: 3rem 1rem; font-style: italic; }
        .user-table { display: flex; flex-direction: column; gap: 0; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; overflow: hidden; }
        .user-row { display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr 100px; gap: 1rem; padding: 1rem; align-items: center; border-bottom: 1px solid rgba(255,215,0,0.1); }
        .user-row:last-child { border-bottom: none; }
        .user-row strong { color: #ffd700; }
        .user-head { background: #1a1a1a; font-weight: 600; color: rgba(255,215,0,0.7); text-transform: uppercase; font-size: 0.8rem; }
        .user-head span { color: rgba(255,215,0,0.7); }
        .live-badge { font-size: 0.7rem; color: #4caf50; vertical-align: middle; margin-left: 0.5rem; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
