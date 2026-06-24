"use client";
import { useState } from "react";

/**
 * AdminLoginForm — Secure admin portal login.
 * Two-factor authentication (2FA) required.
 * Trust device option (30-day cookie).
 *
 * Handles admin authentication and session management.
 */
export function AdminLoginForm({ onSubmit, isLoading }) {
  const [step, setStep] = useState("credentials"); // 'credentials' | '2fa'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    twoFaCode: "",
    trustDevice: false,
  });
  const [sessionToken, setSessionToken] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [twoFaSecret, setTwoFaSecret] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    try {
      // Call backend: POST /api/auth/admin-login
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      setSessionToken(data.sessionToken);
      setCsrfToken(data.csrfToken);
      setQrCode(data.qrCode);
      setTwoFaSecret(data.secret);
      setStep("2fa");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTwoFaSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.twoFaCode || formData.twoFaCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      // Call backend: POST /api/auth/verify-2fa
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          twoFaCode: formData.twoFaCode,
          trustDevice: formData.trustDevice,
          csrfToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid 2FA code");
      }

      const data = await response.json();
      // Store admin token in secure cookie
      document.cookie = `adminToken=${data.adminToken}; Secure; HttpOnly; SameSite=Strict`;
      // Store admin info in session storage for dashboard access
      sessionStorage.setItem("adminAuth", JSON.stringify({
        adminName: data.adminName,
        adminToken: data.adminToken
      }));

      // Redirect to dashboard
      await onSubmit(data);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  if (step === "2fa") {
    return (
      <form onSubmit={handleTwoFaSubmit} className="admin-login-form dark">
        <div className="form-section">
          <h2 className="form-title">Two-Factor Authentication</h2>
          <p className="form-subtitle">Set up your authenticator app</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        {qrCode && (
          <div className="form-group" style={{ textAlign: "center" }}>
            <p className="form-hint" style={{ marginBottom: "12px", fontSize: "12px" }}>
              Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator
            </p>
            <img
              src={qrCode}
              alt="2FA QR Code"
              style={{
                width: "200px",
                height: "200px",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "8px",
                padding: "8px",
                backgroundColor: "#fff"
              }}
            />
            <p className="form-hint" style={{ marginTop: "12px", fontSize: "11px", opacity: 0.7 }}>
              Or enter manually: <code style={{ fontSize: "10px" }}>{twoFaSecret}</code>
            </p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="twoFaCode">Authentication Code *</label>
          <input
            type="text"
            id="twoFaCode"
            name="twoFaCode"
            placeholder="000000"
            value={formData.twoFaCode}
            onChange={handleChange}
            maxLength="6"
            pattern="\d{6}"
            disabled={isLoading}
            autoFocus
            style={{ letterSpacing: "4px", fontSize: "16px", textAlign: "center" }}
          />
          <p className="form-hint">Enter the 6-digit code from your authenticator app</p>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="trustDevice"
              checked={formData.trustDevice}
              onChange={handleChange}
              disabled={isLoading}
            />
            <span>Trust this device for 30 days</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-gold btn-large"
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "SIGN IN TO DASHBOARD"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setFormData({ ...formData, twoFaCode: "" });
            setError(null);
          }}
          className="btn btn-ghost"
          disabled={isLoading}
        >
          Back to Login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLoginSubmit} className="admin-login-form dark">
      <div className="form-section">
        <h2 className="form-title">El Perri Admin</h2>
        <p className="form-subtitle">Secure Portal</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="admin@elperrilatinfood.com"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>

      <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
        <a href="/admin/forgot-password" className="link-accent" style={{ fontSize: "12px" }}>
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className="btn btn-gold btn-large"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "SIGN IN TO DASHBOARD"}
      </button>

      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "1rem" }}>
        🔒 This login is encrypted and monitored. All activity logged for security audits.
      </div>
    </form>
  );
}
