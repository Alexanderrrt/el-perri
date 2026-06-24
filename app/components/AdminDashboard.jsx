"use client";
import { useState, useEffect } from "react";

/**
 * AdminDashboard — Admin panel showing real-time metrics and orders.
 * Displays: today's orders, revenue, registered users, marketing opt-in rate.
 * Live orders table with status updates.
 *
 * Requires admin authentication token.
 */
export function AdminDashboard({ adminToken }) {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch metrics: GET /api/admin/dashboard/metrics
      const metricsRes = await fetch("/api/admin/dashboard/metrics", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // Fetch live orders: GET /api/admin/orders/live
      const ordersRes = await fetch("/api/admin/orders/live", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!metricsRes.ok || !ordersRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const metricsData = await metricsRes.json();
      const ordersData = await ordersRes.json();

      setMetrics(metricsData);
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!metrics) return <div className="admin-error">No data available</div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>El Perri Admin Dashboard</h1>
        <div className="admin-header-actions">
          <span>Admin: {metrics.adminName}</span>
          <button className="btn btn-small">Sign Out</button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">TODAY'S ORDERS</p>
          <p className="metric-value">{metrics.todayOrders}</p>
          <p className="metric-change">↑ {metrics.todayOrdersChange}% from yesterday</p>
        </div>

        <div className="metric-card">
          <p className="metric-label">REVENUE TODAY</p>
          <p className="metric-value">${metrics.revenueToday.toFixed(2)}</p>
          <p className="metric-change">Avg: ${metrics.avgOrderValue.toFixed(2)}/order</p>
        </div>

        <div className="metric-card">
          <p className="metric-label">REGISTERED USERS</p>
          <p className="metric-value">{metrics.registeredUsers}</p>
          <p className="metric-change">+{metrics.newUsersWeek} this week</p>
        </div>

        <div className="metric-card">
          <p className="metric-label">MARKETING OPT-IN</p>
          <p className="metric-value">{metrics.marketingOptInPercent}%</p>
          <p className="metric-change">of active contacts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          LIVE ORDERS
        </button>
        <button
          className={`tab ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          CUSTOMERS
        </button>
        <button
          className={`tab ${activeTab === "marketing" ? "active" : ""}`}
          onClick={() => setActiveTab("marketing")}
        >
          MARKETING
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          SETTINGS
        </button>
      </div>

      {/* Orders Table */}
      {activeTab === "orders" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>TOTAL</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.orderNumber}</td>
                  <td>{order.customerName || "Guest"}</td>
                  <td className="order-total">${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <a href={`/admin/orders/${order.id}`} className="link-primary">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="admin-section">
          <p>Customer management coming soon...</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            View customer profiles, order history, and marketing preferences.
          </p>
        </div>
      )}

      {/* Marketing Tab */}
      {activeTab === "marketing" && (
        <div className="admin-section">
          <p>Marketing campaign management coming soon...</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Send campaigns, track engagement, manage opt-in/opt-out requests.
          </p>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="admin-section">
          <p>Admin settings coming soon...</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Database backups, user roles, privacy compliance configurations.
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button className="btn btn-small" onClick={fetchDashboardData}>
          🔄 Refresh Now
        </button>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
          Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
