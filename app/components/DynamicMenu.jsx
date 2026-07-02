"use client";
import { useEffect, useState } from "react";
import { Reveal, OrderButton } from "./index";
import { SITE, waLink } from "../site.config";
import { listMenuItems, subscribeToMenu } from "@/lib/menuStore";

export function DynamicMenu() {
  const [menuGroups, setMenuGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems();
    // Live updates: when admin changes the menu, the public page reflects it instantly
    const unsubscribe = subscribeToMenu(() => fetchMenuItems());
    return unsubscribe;
  }, []);

  const fetchMenuItems = async () => {
    try {
      const items = await listMenuItems();

      // Group items by category, preserving first-seen order
      const grouped = {};
      items.forEach((item) => {
        const category = item.category || "Otros";
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
      });

      const groupedArray = Object.entries(grouped).map(([group, items]) => ({ group, items }));
      setMenuGroups(groupedArray);
      setError(null);
    } catch (err) {
      console.error("Menu fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Cargando el menú...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <p>Error al cargar el menú: {error}</p>
      </div>
    );
  }

  if (menuGroups.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>No hay platos disponibles por ahora</p>
      </div>
    );
  }

  return (
    <>
      {menuGroups.map((group, gi) => (
        <Reveal key={group.group}>
          <div className="menu-section">
            <h2 data-num={String(gi + 1).padStart(2, "0")}>{group.group}</h2>
            {group.items.map((item) => (
              <div className="row" key={item.id}>
                <div className="row-main">
                  <div className="row-name">
                    <h3>{item.name}</h3>
                    {item.tag && <span className="chip">{item.tag}</span>}
                  </div>
                  {item.description && <p className="row-desc">{item.description}</p>}
                </div>
                <div className="row-cta">
                  <span className="row-price">{item.price}</span>
                  {SITE.whatsapp && (
                    <a
                      className="row-order"
                      href={waLink(`Hola El Perri 👋 Quiero pedir: ${item.name} (${item.price})`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Pedir ${item.name} por WhatsApp`}
                    >
                      Pedir
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ))}

      <Reveal>
        <p className="form-note">
          Los precios no incluyen impuestos. Las bebidas calientes están disponibles solo en
          invierno.
        </p>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <OrderButton variant="primary" />
          <a href={SITE.mapUrl} className="btn btn-dark" target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
          <button
            onClick={fetchMenuItems}
            className="btn btn-small"
            style={{ marginLeft: "auto" }}
          >
            🔄 Actualizar menú
          </button>
        </div>
      </Reveal>
    </>
  );
}
