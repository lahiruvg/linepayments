"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const payWithPayPay = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/paypay-create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 10,
          description: "Checkout order payment"
        })
      });

      const data = await res.json();
      console.log("PayPay Response:", data);

      const url = data?.raw?.data?.url;

      if (!url) {
        alert("PayPay did not return a redirect URL");
        return;
      }

      // Automatic redirect to PayPay
      window.location.href = url;

    } catch (err) {
      console.error("PayPay error", err);
      alert("Payment request failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Checkout Page</h1>

      <button
        onClick={payWithPayPay}
        disabled={loading}
        style={{
          padding: "12px 20px",
          background: "#ff0033",
          color: "white",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {loading ? "Connecting to PayPay…" : "Pay with PayPay"}
      </button>
    </div>
  );
}
