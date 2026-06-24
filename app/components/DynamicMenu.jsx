"use client";
import { useEffect, useState } from "react";
import { Reveal, OrderButton } from "./index";
import { SITE } from "../site.config";

export function DynamicMenu() {
  const [menuGroups, setMenuGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/menu-items");
      if (!res.ok) throw new Error("Failed to fetch menu");

      const data = await res.json();
      const items = data.items || [];

      // Group items by category
      const grouped = {};
      items.forEach(item => {
        const category = item.category || "OTROS";
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
      });

      // Convert to array format matching original structure
      const groupedArray = Object.entries(grouped).map(([group, items]) => ({
        group,
        items
      }));

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
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <p>Error loading menu: {error}</p>
      </div>
    );
  }

  if (menuGroups.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>No menu items available</p>
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
                <span className="row-price">{item.price}</span>
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
            🔄 Refresh Menu
          </button>
        </div>
      </Reveal>
    </>
  );
}
