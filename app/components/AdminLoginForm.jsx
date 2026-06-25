"use client";
import { useState } from "react";

/**
 * AdminLoginForm — simple admin access: username + 4-digit PIN (no 2FA).
 * On success, stores the session in sessionStorage and goes to the dashboard.
 */
export function AdminLoginForm({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || pin.length !== 4) {
      setError("Escribe el usuario y un PIN de 4 dígitos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Usuario o PIN incorrecto");
      }

      const data = await res.json();
      sessionStorage.setItem(
        "adminAuth",
        JSON.stringify({ adminName: data.adminName, adminToken: data.adminToken })
      );

      if (onSubmit) await onSubmit(data);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-login-form dark">
      <div className="form-section">
        <h2 className="form-title">El Perri · Panel</h2>
        <p className="form-subtitle">Acceso del administrador</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="username">Usuario</label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="admin"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(null); }}
          autoFocus
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pin">PIN (4 dígitos)</label>
        <input
          type="password"
          id="pin"
          name="pin"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(null); }}
          disabled={loading}
          style={{ letterSpacing: "10px", textAlign: "center", fontSize: "22px" }}
        />
      </div>

      <button type="submit" className="btn btn-gold btn-large" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
