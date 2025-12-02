"use client";

export default function CheckoutPage() {
  const handlePayment = async () => {
    const res = await fetch("/api/paypay-create-payment", { method: "POST" });
    const data = await res.json();

    const redirect = data.data?.url;

    if (redirect) {
      window.location.href = redirect; // 🔥 Redirect to PayPay app
    } else {
      alert("Payment failed. Check console.");
      console.log(data);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>PayPay Mobile Checkout</h1>
      <p>Pay 10 JPY</p>
      <button
        onClick={handlePayment}
        style={{
          padding: "10px 20px",
          fontSize: "18px",
          background: "#ff4040",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
        }}
      >
        Pay with PayPay
      </button>
    </div>
  );
}
