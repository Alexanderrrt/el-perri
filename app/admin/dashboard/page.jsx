"use client";
import { useState, useEffect } from "react";
import { listMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, subscribeToMenu } from "@/lib/menuStore";
import { listDailySubscribers, deleteSubscriber, getDailySpecial, setDailySpecial } from "@/lib/lunchStore";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * AdminDashboard — production admin panel for El Perri.
 *
 * Two responsibilities only:
 *   1. Menú      — create / edit / delete menu items (synced live to the site via Supabase).
 *   2. Almuerzo  — set the daily lunch special, manage subscribers, send the email now.
 *
 * Access is gated server-side by proxy.ts (signed admin_session cookie); this
 * component additionally redirects to /admin/login if the local session is missing.
 */
export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [notification, setNotification] = useState(null);

  const [menuItems, setMenuItems] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", description: "", tag: "" });

  const [lunchText, setLunchText] = useState("");
  const [lunchSubs, setLunchSubs] = useState([]);
  const [savingLunch, setSavingLunch] = useState(false);
  const [sendingLunch, setSendingLunch] = useState(false);

  useEffect(() => {
    const authData = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : null;
    if (!authData) {
      window.location.href = "/admin/login";
      return;
    }
    setAdmin(JSON.parse(authData));
    refreshMenu();
    refreshLunch();

    // Real-time: menu edits on any device refresh this panel live.
    if (isSupabaseConfigured) {
      const unsubMenu = subscribeToMenu(() => refreshMenu());
      return () => unsubMenu();
    }
  }, []);

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Menu ──────────────────────────────────────────────────────────────────
  const refreshMenu = async () => {
    try {
      setMenuItems(await listMenuItems());
    } catch (err) {
      notify("No se pudo cargar el menú: " + err.message, "error");
    }
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

  // ── Daily lunch ───────────────────────────────────────────────────────────
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

  return (
    <div className="admin-dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      <nav className="admin-nav">
        <div className="admin-nav-brand">
          <h1>El Perri · Panel</h1>
          {admin?.adminName && <span className="admin-who">{admin.adminName}</span>}
        </div>
        <button className="btn-logout" onClick={async () => {
          sessionStorage.removeItem("adminAuth");
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}>Cerrar sesión</button>
      </nav>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>📋 Menú</button>
        <button className={`tab-btn ${activeTab === "lunch" ? "active" : ""}`} onClick={() => setActiveTab("lunch")}>🍽️ Almuerzo del día</button>
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
        .notification-success { background: #4caf50; color: #fff; border-left: 4px solid #45a049; }
        .notification-error { background: #ff4444; color: #fff; border-left: 4px solid #cc0000; }
        .notification-info { background: #2196f3; color: #fff; border-left: 4px solid #0b7dda; }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .admin-dashboard { display: flex; flex-direction: column; min-height: 100vh; background: #0a0a0a; color: #fff; }
        .admin-nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; background: #1a1a1a; border-bottom: 1px solid rgba(255,215,0,0.1); }
        .admin-nav-brand { display: flex; align-items: baseline; gap: 0.75rem; }
        .admin-nav-brand h1 { margin: 0; color: #ffd700; }
        .admin-who { color: rgba(255,255,255,0.45); font-size: 0.85rem; }
        .admin-tabs { display: flex; gap: 0.5rem; padding: 1rem 2rem; background: #1a1a1a; border-bottom: 1px solid rgba(255,215,0,0.1); flex-wrap: wrap; }
        .tab-btn { padding: 0.75rem 1rem; background: transparent; border: 1px solid rgba(255,215,0,0.2); color: rgba(255,255,255,0.7); border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { background: #ffd700; color: #000; border-color: #ffd700; }
        .tab-btn:hover { border-color: #ffd700; color: #ffd700; }
        .admin-main { flex: 1; padding: 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .form-section { background: #1a1a1a; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .form-section input, .form-section textarea, .form-section select { background: #0a0a0a; border: 1px solid rgba(255,215,0,0.2); color: #fff; padding: 0.75rem; border-radius: 4px; font-family: inherit; font-size: 1rem; }
        .form-section textarea { min-height: 80px; }
        .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
        .item-card { background: #1a1a1a; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; }
        .item-card strong { color: #ffd700; }
        .category { color: rgba(255,215,0,0.6); font-size: 0.9rem; margin: 0; }
        .price { color: #ffd700; font-weight: bold; font-size: 1.2rem; margin: 0; }
        .desc { color: rgba(255,255,255,0.6); font-size: 0.85rem; line-height: 1.3; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600; border: none; font-size: 1rem; transition: all 0.2s; }
        .btn-gold { background: #ffd700; color: #000; }
        .btn-gold:hover { background: #ffed4e; transform: translateY(-2px); }
        .btn-logout { padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600; border: 1px solid rgba(255,215,0,0.3); background: transparent; color: #ffd700; font-size: 1rem; }
        .btn-small { padding: 0.5rem 1rem; font-size: 0.875rem; background: #ffd700; color: #000; }
        .btn-small:hover { background: #ffed4e; }
        .btn-danger { background: #ff4444; color: #fff; }
        .btn-danger:hover { background: #ff6666; }
        .actions { display: flex; gap: 0.5rem; margin-top: auto; padding-top: 1rem; }
        .empty-state { text-align: center; color: rgba(255,255,255,0.5); padding: 3rem 1rem; font-style: italic; }
        .user-table { display: flex; flex-direction: column; gap: 0; border: 1px solid rgba(255,215,0,0.2); border-radius: 8px; overflow: hidden; }
        .user-row { display: grid; gap: 1rem; padding: 1rem; align-items: center; border-bottom: 1px solid rgba(255,215,0,0.1); }
        .user-row:last-child { border-bottom: none; }
        .user-row strong { color: #ffd700; }
        .user-head { background: #1a1a1a; font-weight: 600; color: rgba(255,215,0,0.7); text-transform: uppercase; font-size: 0.8rem; }
        .user-head span { color: rgba(255,215,0,0.7); }
        .small { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0.25rem 0; }
        .live-badge { font-size: 0.7rem; color: #4caf50; vertical-align: middle; margin-left: 0.5rem; animation: pulse 2s infinite; }
        .hint-text { color: rgba(255,255,255,0.55); font-size: 0.85rem; margin: -1rem 0 1.5rem 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
