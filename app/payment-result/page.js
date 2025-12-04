import { Suspense } from "react";
import PaymentResultClient from "./payment-result-client";

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <PaymentResultClient />
    </Suspense>
  );
}
