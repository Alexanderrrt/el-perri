"use client";
import { useState } from "react";
import { SITE } from "../site.config";

/**
 * GuestCheckoutForm — Minimal checkout for guests.
 * Collects: email, phone, address.
 * Optional: marketing_consent checkbox (pre-checked).
 *
 * Handles guest order creation and double opt-in flow.
 */
export function GuestCheckoutForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    delivery_address: "",
    marketing_consent: true,
    promo_code: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const validatePromoCode = async () => {
    if (!formData.promo_code.trim()) {
      setError("Please enter a promo code");
      return;
    }

    try {
      const res = await fetch(`/api/promotions?code=${encodeURIComponent(formData.promo_code)}`);
      if (!res.ok) {
        setError("Invalid or expired promo code");
        setPromoApplied(null);
        setPromoDiscount(0);
        return;
      }
      const data = await res.json();
      const promo = data.promo;
      setPromoApplied(promo.code);
      setPromoDiscount(promo.discount);
      setError(null);
    } catch (err) {
      setError("Failed to validate promo code");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.phone || !formData.delivery_address) {
      setError("All fields are required");
      return;
    }

    try {
      const orderData = {
        ...formData,
        discount_code: promoApplied,
        discount_percent: promoDiscount
      };
      await onSubmit(orderData);
      setSuccess(true);
      setFormData({ email: "", phone: "", delivery_address: "", marketing_consent: true, promo_code: "" });
      setPromoApplied(null);
      setPromoDiscount(0);
    } catch (err) {
      setError(err.message || "Failed to process order");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="guest-checkout-form">
      <div className="form-section">
        <h2 className="form-title">Complete Your Order</h2>
        <p className="form-subtitle">Guest checkout — no account needed</p>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">Order confirmed! Check your email.</div>}

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <p className="form-hint">For order confirmation and tracking</p>
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="(408) 555-0123"
          value={formData.phone}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <p className="form-hint">For delivery driver contact</p>
      </div>

      <div className="form-group">
        <label htmlFor="delivery_address">Delivery Address *</label>
        <input
          type="text"
          id="delivery_address"
          name="delivery_address"
          placeholder="123 Main St, San Jose, CA 95110"
          value={formData.delivery_address}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-divider"></div>

      <div className="form-group">
        <label htmlFor="promo_code">Promo Code (Optional)</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            id="promo_code"
            name="promo_code"
            placeholder="Enter code: WELCOME, FRIENDS..."
            value={formData.promo_code}
            onChange={handleChange}
            disabled={isLoading || promoApplied}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={validatePromoCode}
            disabled={isLoading || promoApplied || !formData.promo_code.trim()}
            className="btn btn-small"
            style={{ whiteSpace: "nowrap" }}
          >
            Apply
          </button>
        </div>
        {promoApplied && (
          <p className="form-hint" style={{ color: "#4caf50", marginTop: "8px" }}>
            ✓ {promoApplied}: {promoDiscount}% off applied
          </p>
        )}
      </div>

      <div className="form-divider"></div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="marketing_consent"
            checked={formData.marketing_consent}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>
            <strong>Send me special offers & new menu updates</strong>
            <br />
            <span className="form-hint">
              You can unsubscribe anytime.{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy policy
              </a>
            </span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-large"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "CONTINUE TO PAYMENT →"}
      </button>

      <p className="form-footer">
        Want a rewards account?{" "}
        <a href="/signup" className="link-primary">
          Create one anytime
        </a>
      </p>
    </form>
  );
}
