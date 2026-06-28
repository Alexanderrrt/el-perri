"use client";
import { useState, useEffect } from "react";
import { listUsers, deleteUserById } from "@/lib/userStore";
import { listMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, subscribeToMenu } from "@/lib/menuStore";
import { listDailySubscribers, deleteSubscriber, getDailySpecial, setDailySpecial } from "@/lib/lunchStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [notification, setNotification] = useState(null);

  const [menuItems, setMenuItems] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", description: "", tag: "" });

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [lunchText, setLunchText] = useState("");
  const [lunchSubs, setLunchSubs] = useState([]);
  const [savingLunch, setSavingLunch] = useState(false);
  const [sendingLunch, setSendingLunch] = useState(false);

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
    if (!authData) {
      window.location.href = "/admin/login";
      return;
    }
    setAdmin(JSON.parse(authData));
    loadAllData();
    refreshUsers();
    refreshMenu();
    refreshLunch();

    // Real-time: changes on ANY device update these tables live
    if (isSupabaseConfigured) {
      const usersChannel = supabase
        .channel("registered_users_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "registered_users" },
          () => refreshUsers()
        )
        .subscribe();
      const unsubMenu = subscribeToMenu(() => refreshMenu());
      return () => {
        supabase.removeChannel(usersChannel);
        unsubMenu();
      };
    }
  }, []);

  const loadAllData = () => {
    if (typeof window === "undefined") return;
    const ordr = localStorage.getItem("orders");
    const cust = localStorage.getItem("customers");
    const inv = localStorage.getItem("inventory");
    const stf = localStorage.getItem("staff");
    const promo = localStorage.getItem("promotions");

    if (ordr) setOrders(JSON.parse(ordr));
    if (cust) setCustomers(JSON.parse(cust));
    if (inv) setInventory(JSON.parse(inv));
    if (stf) setStaff(JSON.parse(stf));
    if (promo) setPromotions(JSON.parse(promo));
  };

  const refreshMenu = async () => {
    try {
      setMenuItems(await listMenuItems());
    } catch (err) {
      notify("No se pudo cargar el menú: " + err.message, "error");
    }
  };

  const refreshLunch = async () => {
    try {
      const [special, subs] = await Promise.all([getDailySpecial(), listDailySubscribers()]);
      setLunchText(special.lunch || "");
      setLunchSubs(subs);
    } catch (err) {
      notify("No se pudo cargar el almuerzo del día: " + err.message, "error");
    }
  };

  const saveLunch = async () => {
    if (!lunchText.trim()) {
      notify("Escribe el almuerzo del día primero", "error");
      return;
    }
    setSavingLunch(true);
    try {
      await setDailySpecial(lunchText);
      notify("✓ Almuerzo del día guardado", "success");
    } catch (err) {
      notify("No se pudo guardar: " + err.message, "error");
    } finally {
      setSavingLunch(false);
    }
  };

  const removeLunchSub = async (id) => {
    if (typeof window !== "undefined" && !window.confirm("¿Quitar este suscriptor?")) return;
    try {
      await deleteSubscriber(id);
      await refreshLunch();
      notify("Suscriptor eliminado", "success");
    } catch (err) {
      notify("No se pudo eliminar: " + err.message, "error");
    }
  };

  const sendLunchNow = async () => {
    if (!lunchText.trim()) {
      notify("Primero guarda el almuerzo del día", "error");
      return;
    }
    const secret = typeof window !== "undefined"
      ? window.prompt("Para enviar el correo ahora, escribe tu CRON_SECRET (de Vercel):")
      : null;
    if (!secret) return;
    setSendingLunch(true);
    try {
      const res = await fetch("/api/cron/daily-lunch", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falló el envío");
      notify(`✓ Correo enviado a ${data.sent} suscriptores`, "success");
    } catch (err) {
      notify("No se pudo enviar: " + err.message, "error");
    } finally {
      setSendingLunch(false);
    }
  };

  const exportLunchCSV = () => {
    if (lunchSubs.length === 0) { notify("No hay suscriptores para exportar", "error"); return; }
    const headers = ["Correo", "Nombre", "Registrado"];
    const rows = lunchSubs.map((s) => [s.email, s.name || "N/A", s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A"]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `el-perri-almuerzo-suscriptores-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Se exportaron ${lunchSubs.length} suscriptores`, "success");
  };

  const refreshUsers = async () => {
    try {
      setUsers(await listUsers());
    } catch (err) {
      notify("No se pudieron cargar los usuarios: " + err.message, "error");
    }
  };

  const deleteUser = async (userId) => {
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUserById(userId);
      await refreshUsers();
      notify("Usuario eliminado", "success");
    } catch (err) {
      notify("No se pudo eliminar: " + err.message, "error");
    }
  };

  const exportUsersCSV = () => {
    if (users.length === 0) {
      notify("No hay usuarios para exportar", "error");
      return;
    }
    const headers = ["Correo", "Nombre", "Newsletter", "Registrado"];
    const rows = users.map(u => [
      u.email,
      u.name || "N/A",
      u.newsletter ? "Sí" : "No",
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
    notify(`Se exportaron ${users.length} usuarios para marketing`, "success");
  };

  const exportEmailsOnly = () => {
    if (users.length === 0) {
      notify("No hay usuarios para exportar", "error");
      return;
    }
    const emails = users.map(u => u.email).join(", ");
    navigator.clipboard.writeText(emails).then(() => {
      notify(`Se copiaron ${users.length} correos al portapapeles`, "success");
    }).catch(() => {
      notify("No se pudo copiar al portapapeles", "error");
    });
  };

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddMenu = async () => {
    if (!menuForm.name || !menuForm.price) {
      notify("El nombre y el precio son obligatorios", "error");
      return;
    }
    try {
      if (editingId) {
        await updateMenuItem(editingId, menuForm);
        notify(`✓ "${menuForm.name}" actualizado`, "success");
        setEditingId(null);
      } else {
        await addMenuItem(menuForm);
        notify(`✓ "${menuForm.name}" agregado al menú`, "success");
      }
      await refreshMenu();
      setMenuForm({ name: "", category: "", price: "", description: "", tag: "" });
      setShowAddMenu(false);
    } catch (err) {
      notify("No se pudo guardar: " + err.message, "error");
    }
  };

  const deleteMenu = async (id, name) => {
    if (typeof window !== "undefined" && !window.confirm(`¿Eliminar "${name}" del menú?`)) return;
    try {
      await deleteMenuItem(id);
      await refreshMenu();
      notify(`"${name}" eliminado`, "success");
    } catch (err) {
      notify("No se pudo eliminar: " + err.message, "error");
    }
  };

  const editMenu = (item) => {
    setMenuForm({
      name: item.name || "",
      category: item.category || "",
      price: item.price || "",
      description: item.description || "",
      tag: item.tag || "",
    });
    setEditingId(item.id);
    setShowAddMenu(true);
    notify("Editando plato — guarda los cambios abajo", "info");
  };

  const priceLabel = (p) => {
    const s = String(p ?? "").trim();
    if (!s) return "";
    return /^[0-9.]+$/.test(s) ? `$${s}` : s;
  };

  const saveInventory = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("inventory", JSON.stringify(items));
    setInventory(items);
  };

  const handleAddInventory = () => {
    if (!inventoryForm.name || !inventoryForm.quantity) {
      notify("El nombre y la cantidad son obligatorios", "error");
      return;
    }
    saveInventory([...inventory, { ...inventoryForm, id: Date.now() }]);
    setInventoryForm({ name: "", quantity: "", unit: "", minStock: "" });
    setShowAddInventory(false);
    notify("Insumo agregado", "success");
  };

  const deleteInventory = (id) => { saveInventory(inventory.filter(i => i.id !== id)); notify("Insumo eliminado", "success"); };

  const saveStaff = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("staff", JSON.stringify(items));
    setStaff(items);
  };

  const handleAddStaff = () => {
    if (!staffForm.name || !staffForm.email) {
      notify("El nombre y el correo son obligatorios", "error");
      return;
    }
    saveStaff([...staff, { ...staffForm, id: Date.now() }]);
    setStaffForm({ name: "", email: "", role: "", phone: "" });
    setShowAddStaff(false);
    notify("Empleado agregado", "success");
  };

  const deleteStaff = (id) => { saveStaff(staff.filter(s => s.id !== id)); notify("Empleado eliminado", "success"); };

  const savePromo = (items) => {
    if (typeof window !== "undefined") localStorage.setItem("promotions", JSON.stringify(items));
    setPromotions(items);
  };

  const handleAddPromo = () => {
    if (!promoForm.code || !promoForm.discount) {
      notify("El código y el descuento son obligatorios", "error");
      return;
    }
    savePromo([...promotions, { ...promoForm, id: Date.now() }]);
    setPromoForm({ code: "", discount: "", type: "percent", expiry: "" });
    setShowAddPromo(false);
    notify("Promoción creada", "success");
  };

  const deletePromo = (id) => { savePromo(promotions.filter(p => p.id !== id)); notify("Promoción eliminada", "success"); };

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
        <div className="admin-nav-brand"><h1>El Perri · Panel</h1></div>
        <button className="btn-logout" onClick={async () => {
          sessionStorage.removeItem("adminAuth");
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}>Cerrar sesión</button>
      </nav>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>📋 Menú</button>
        <button className={`tab-btn ${activeTab === "lunch" ? "active" : ""}`} onClick={() => setActiveTab("lunch")}>🍽️ Almuerzo del día</button>
        <button className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>📊 Estadísticas</button>
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>📧 Usuarios y Marketing</button>
      </div>

      <main className="admin-main">
        {activeTab === "menu" && (
          <div>
            <div className="section-header">
              <h2>Gestión del Menú {isSupabaseConfigured && <span className="live-badge">● EN VIVO</span>}</h2>
              <button className="btn btn-gold" onClick={() => {
                setShowAddMenu(!showAddMenu);
                setEditingId(null);
                setMenuForm({ name: "", category: "", price: "", description: "", tag: "" });
              }}>{showAddMenu ? "Cancelar" : "+ Agregar plato"}</button>
            </div>
            <p className="hint-text">Los cambios se guardan en la base de datos y aparecen al instante en el menú del sitio web.</p>
            {showAddMenu && (
              <div className="form-section">
                <input placeholder="Nombre del plato" value={menuForm.name} onChange={(e) => setMenuForm({...menuForm, name: e.target.value})} />
                <input placeholder="Categoría (ej. Hamburguesas, Patacones)" value={menuForm.category} onChange={(e) => setMenuForm({...menuForm, category: e.target.value})} />
                <input placeholder="Precio (ej. $15)" value={menuForm.price} onChange={(e) => setMenuForm({...menuForm, price: e.target.value})} />
                <input placeholder="Etiqueta (opcional: Favorita, Nuevo...)" value={menuForm.tag} onChange={(e) => setMenuForm({...menuForm, tag: e.target.value})} />
                <textarea placeholder="Descripción" value={menuForm.description} onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}></textarea>
                <button className="btn btn-gold" onClick={handleAddMenu}>{editingId ? "Guardar cambios" : "Agregar plato"}</button>
              </div>
            )}
            <div className="items-grid">
              {menuItems.length === 0 ? (
                <p className="empty-state">Aún no hay platos en el menú</p>
              ) : (
                menuItems.map(item => (
                  <div key={item.id} className="item-card">
                    <strong>{item.name}</strong>
                    <p className="category">{item.category}{item.tag ? ` · ${item.tag}` : ""}</p>
                    <p className="price">{priceLabel(item.price)}</p>
                    <p className="desc">{item.description}</p>
                    <div className="actions">
                      <button className="btn btn-small" onClick={() => editMenu(item)}>Editar</button>
                      <button className="btn btn-small btn-danger" onClick={() => deleteMenu(item.id, item.name)}>Eliminar</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "lunch" && (
          <div>
            <div className="section-header">
              <h2>Almuerzo del Día {isSupabaseConfigured && <span className="live-badge">● EN VIVO</span>}</h2>
            </div>
            <p className="hint-text">Escribe el almuerzo de hoy y guárdalo. Cada mañana se envía por correo a los suscriptores. También puedes enviarlo ahora mismo.</p>

            <div className="form-section">
              <label style={{ color: "#ffd700", fontWeight: 600, fontSize: "0.9rem" }}>¿Cuál es el almuerzo de hoy?</label>
              <textarea
                placeholder="Ej: Bandeja paisa con frijoles, arroz, carne, chicharrón, huevo, maduro y arepa. Incluye jugo natural — $15"
                value={lunchText}
                onChange={(e) => setLunchText(e.target.value)}
                style={{ minHeight: "100px" }}
              ></textarea>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-gold" onClick={saveLunch} disabled={savingLunch}>
                  {savingLunch ? "Guardando..." : "Guardar almuerzo de hoy"}
                </button>
                <button className="btn btn-small" onClick={sendLunchNow} disabled={sendingLunch}>
                  {sendingLunch ? "Enviando..." : "📩 Enviar correo ahora"}
                </button>
              </div>
            </div>

            <div className="section-header" style={{ marginTop: "2rem" }}>
              <h3 style={{ color: "#ffd700" }}>Suscriptores del almuerzo ({lunchSubs.length})</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-small" onClick={refreshLunch}>🔄 Actualizar</button>
                <button className="btn btn-gold" onClick={exportLunchCSV}>⬇ Exportar CSV</button>
              </div>
            </div>

            {lunchSubs.length === 0 ? (
              <p className="empty-state">Aún no hay suscriptores. Cuando alguien pida el almuerzo del día en la burbuja de bienvenida, aparecerá aquí.</p>
            ) : (
              <div className="user-table">
                <div className="user-row user-head" style={{ gridTemplateColumns: "1.5fr 2fr 1fr 100px" }}>
                  <span>Nombre</span>
                  <span>Correo</span>
                  <span>Registro</span>
                  <span></span>
                </div>
                {lunchSubs.map((s) => (
                  <div key={s.id} className="user-row" style={{ gridTemplateColumns: "1.5fr 2fr 1fr 100px" }}>
                    <span><strong>{s.name}</strong></span>
                    <span>{s.email}</span>
                    <span className="small">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A"}</span>
                    <span><button className="btn btn-small btn-danger" onClick={() => removeLunchSub(s.id)}>Eliminar</button></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2>Gestión de Pedidos</h2>
            {orders.length === 0 ? (
              <p className="empty-state">Aún no hay pedidos</p>
            ) : (
              <div className="cards-grid">
                {orders.map(order => (
                  <div key={order.id} className="card">
                    <strong>Pedido #{order.id}</strong>
                    <p>{order.customer} • ${order.total}</p>
                    <select value={order.status} onChange={(e) => handleOrderStatus(order.id, e.target.value)}>
                      <option value="pending">Pendiente</option>
                      <option value="preparing">En preparación</option>
                      <option value="ready">Listo</option>
                      <option value="completed">Entregado</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2>Estadísticas y Reportes</h2>
            <div className="stats-grid">
              <div className="stat"><h3>Pedidos totales</h3><p className="value">{orders.length}</p></div>
              <div className="stat"><h3>Ingresos</h3><p className="value">${totalRevenue.toFixed(2)}</p></div>
              <div className="stat"><h3>Platos en el menú</h3><p className="value">{menuItems.length}</p></div>
              <div className="stat"><h3>Personal</h3><p className="value">{staff.length}</p></div>
            </div>
            {lowStockItems.length > 0 && <div className="alert alert-warning">⚠️ {lowStockItems.length} insumos con poco stock</div>}
          </div>
        )}

        {activeTab === "customers" && (
          <div>
            <h2>Gestión de Clientes</h2>
            {customers.length === 0 ? (
              <p className="empty-state">Aún no hay clientes</p>
            ) : (
              <div className="cards-grid">
                {customers.map(cust => (
                  <div key={cust.id} className="card"><strong>{cust.name}</strong><p>{cust.email}</p><p className="small">Pedidos: {cust.orders}</p></div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="section-header">
              <h2>Usuarios y Marketing {isSupabaseConfigured && <span className="live-badge">● EN VIVO</span>}</h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn btn-small" onClick={refreshUsers}>🔄 Actualizar</button>
                <button className="btn btn-small" onClick={exportEmailsOnly}>📋 Copiar correos</button>
                <button className="btn btn-gold" onClick={exportUsersCSV}>⬇ Exportar CSV</button>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <div className="stat"><h3>Usuarios totales</h3><p className="value">{users.length}</p></div>
              <div className="stat"><h3>Suscritos al newsletter</h3><p className="value">{users.filter(u => u.newsletter).length}</p></div>
              <div className="stat"><h3>Esta semana</h3><p className="value">{users.filter(u => u.createdAt && (Date.now() - new Date(u.createdAt).getTime()) < 7 * 864e5).length}</p></div>
            </div>

            <input
              placeholder="Buscar por correo o nombre..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: "100%", maxWidth: "400px", marginBottom: "1.5rem", background: "#0a0a0a", border: "1px solid rgba(255,215,0,0.2)", color: "#fff", padding: "0.75rem", borderRadius: "4px" }}
            />

            {users.length === 0 ? (
              <p className="empty-state">Aún no hay usuarios registrados. Cuando alguien se registre en la burbuja de bienvenida, aparecerá aquí.</p>
            ) : (
              <div className="user-table">
                <div className="user-row user-head">
                  <span>Nombre</span>
                  <span>Correo</span>
                  <span>Newsletter</span>
                  <span>Registro</span>
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
                      <span>{user.newsletter ? "✅ Sí" : "—"}</span>
                      <span className="small">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                      <span><button className="btn btn-small btn-danger" onClick={() => deleteUser(user.userId)}>Eliminar</button></span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "inventory" && (
          <div>
            <div className="section-header">
              <h2>Gestión de Inventario</h2>
              <button className="btn btn-gold" onClick={() => setShowAddInventory(!showAddInventory)}>{showAddInventory ? "Cancelar" : "+ Agregar insumo"}</button>
            </div>
            {showAddInventory && (
              <div className="form-section">
                <input placeholder="Nombre del insumo" value={inventoryForm.name} onChange={(e) => setInventoryForm({...inventoryForm, name: e.target.value})} />
                <input placeholder="Cantidad" type="number" value={inventoryForm.quantity} onChange={(e) => setInventoryForm({...inventoryForm, quantity: e.target.value})} />
                <input placeholder="Unidad (kg, L, unid.)" value={inventoryForm.unit} onChange={(e) => setInventoryForm({...inventoryForm, unit: e.target.value})} />
                <input placeholder="Alerta de stock mínimo" type="number" value={inventoryForm.minStock} onChange={(e) => setInventoryForm({...inventoryForm, minStock: e.target.value})} />
                <button className="btn btn-gold" onClick={handleAddInventory}>Agregar insumo</button>
              </div>
            )}
            <div className="cards-grid">
              {inventory.length === 0 ? (
                <p className="empty-state">No hay insumos en el inventario</p>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className={`card ${parseInt(item.quantity) <= parseInt(item.minStock || 0) ? "low-stock" : ""}`}>
                    <strong>{item.name}</strong>
                    <p>{item.quantity} {item.unit}</p>
                    <p className="small">Mín: {item.minStock}</p>
                    <button className="btn btn-small btn-danger" onClick={() => deleteInventory(item.id)}>Eliminar</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "staff" && (
          <div>
            <div className="section-header">
              <h2>Gestión de Personal</h2>
              <button className="btn btn-gold" onClick={() => setShowAddStaff(!showAddStaff)}>{showAddStaff ? "Cancelar" : "+ Agregar empleado"}</button>
            </div>
            {showAddStaff && (
              <div className="form-section">
                <input placeholder="Nombre completo" value={staffForm.name} onChange={(e) => setStaffForm({...staffForm, name: e.target.value})} />
                <input placeholder="Correo" type="email" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} />
                <input placeholder="Cargo (Gerente, Chef, Mesero)" value={staffForm.role} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})} />
                <input placeholder="Teléfono" value={staffForm.phone} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} />
                <button className="btn btn-gold" onClick={handleAddStaff}>Agregar empleado</button>
              </div>
            )}
            <div className="cards-grid">
              {staff.length === 0 ? (
                <p className="empty-state">No hay empleados registrados</p>
              ) : (
                staff.map(member => (
                  <div key={member.id} className="card">
                    <strong>{member.name}</strong>
                    <p className="role">{member.role}</p>
                    <p className="small">{member.email}</p>
                    <p className="small">{member.phone}</p>
                    <button className="btn btn-small btn-danger" onClick={() => deleteStaff(member.id)}>Eliminar</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "promotions" && (
          <div>
            <div className="section-header">
              <h2>Promociones y Descuentos</h2>
              <button className="btn btn-gold" onClick={() => setShowAddPromo(!showAddPromo)}>{showAddPromo ? "Cancelar" : "+ Agregar promoción"}</button>
            </div>
            {showAddPromo && (
              <div className="form-section">
                <input placeholder="Código (VERANO20)" value={promoForm.code} onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
                <input placeholder="Descuento" type="number" step="0.01" value={promoForm.discount} onChange={(e) => setPromoForm({...promoForm, discount: e.target.value})} />
                <select value={promoForm.type} onChange={(e) => setPromoForm({...promoForm, type: e.target.value})}>
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo ($)</option>
                </select>
                <input placeholder="Fecha de vencimiento" type="date" value={promoForm.expiry} onChange={(e) => setPromoForm({...promoForm, expiry: e.target.value})} />
                <button className="btn btn-gold" onClick={handleAddPromo}>Agregar promoción</button>
              </div>
            )}
            <div className="cards-grid">
              {promotions.length === 0 ? (
                <p className="empty-state">No hay promociones</p>
              ) : (
                promotions.map(promo => (
                  <div key={promo.id} className="card">
                    <strong>{promo.code}</strong>
                    <p className="discount">{promo.discount}{promo.type === "percent" ? "%" : "$"} de descuento</p>
                    <p className="small">Vence: {promo.expiry}</p>
                    <button className="btn btn-small btn-danger" onClick={() => deletePromo(promo.id)}>Eliminar</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h2>Ajustes del Restaurante</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Nombre del restaurante</label>
                <input value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Horario</label>
                <input value={settings.hours} onChange={(e) => setSettings({...settings, hours: e.target.value})} />
              </div>
              <button className="btn btn-gold" onClick={() => {
                if (typeof window !== "undefined") localStorage.setItem("settings", JSON.stringify(settings));
                notify("Ajustes guardados", "success");
              }}>Guardar cambios</button>
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
        .hint-text { color: rgba(255,255,255,0.55); font-size: 0.85rem; margin: -1rem 0 1.5rem 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
