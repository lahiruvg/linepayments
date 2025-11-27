export default function PaymentResultPage({ searchParams }) {
  return (
    <div>
      <h1>Payment Result</h1>
      <pre>{JSON.stringify(searchParams, null, 2)}</pre>
      <p>Use this page to handle PayPay callback after payment.</p>
    </div>
  );
}
