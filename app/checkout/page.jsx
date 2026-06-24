"use client";
import { GuestCheckoutForm } from "@/app/components/GuestCheckoutForm";

export default function CheckoutPage() {
  const handleGuestCheckout = async (formData) => {
    try {
      const response = await fetch("/api/checkout/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to process order");
      }

      const data = await response.json();
      // Redirect to payment or confirmation
      window.location.href = `/order-confirmation/${data.orderId}`;
    } catch (error) {
      throw error;
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <GuestCheckoutForm onSubmit={handleGuestCheckout} isLoading={false} />
      </div>
    </main>
  );
}
