"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentResultClient() {
  const search = useSearchParams();
  const merchantPaymentId = search.get("merchantPaymentId");

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    if (!merchantPaymentId) {
      setLoading(false);
      return;
    }

    fetch(`/api/paypay-status?id=${merchantPaymentId}`)
      .then((res) => res.json())
      .then((data) => {
        setPaymentStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [merchantPaymentId]);

  return (
    <div style={{ padding: 40 }}>
      <h1>PayPay Payment Result</h1>

      {!merchantPaymentId && (
        <p>
          No payment ID provided. This usually happens if the payment was not
          completed or timed out.
        </p>
      )}

      {loading && merchantPaymentId && <p>Checking payment status...</p>}

      {!loading && paymentStatus && (
        <>
          <h2>Payment Status:</h2>
          <pre style={{ background: "#f0f0f0", padding: 20 }}>
            {JSON.stringify(paymentStatus, null, 2)}
          </pre>
        </>
      )}

      <a
        href="/checkout"
        style={{ display: "inline-block", marginTop: 20, color: "blue" }}
      >
        Back to Checkout
      </a>
    </div>
  );
}
