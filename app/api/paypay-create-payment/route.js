import crypto from "crypto";
import axios from "axios";

function generateHmacSignature(apiKey, apiSecret, method, path, body, timestamp, nonce) {
  const message = `${timestamp}\n${nonce}\n${method}\n${path}\n${JSON.stringify(body)}\n`;
  return crypto.createHmac("sha256", apiSecret).update(message).digest("base64");
}

export async function POST() {
  try {
    const apiKey = process.env.PAYPAY_API_KEY;
    const apiSecret = process.env.PAYPAY_API_SECRET;
    const merchantId = process.env.PAYPAY_MERCHANT_ID;

    const body = {
      merchantPaymentId: `mp_${Date.now()}`,
      amount: { amount: 10, currency: "JPY" },
      codeType: "PAYMENT",            // 🔥 NON-QR payment
      redirectUrl: "https://linepayments.vercel.app/payment-result",
      redirectType: "WEB_LINK",
    };

    const method = "POST";
    const path = "/v2/payments";
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString("hex");

    const signature = generateHmacSignature(apiKey, apiSecret, method, path, body, timestamp, nonce);

    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "X-ASSUME-MERCHANT": merchantId,
      "Authorization": `hmac OPA-Auth:${apiKey}:${signature}:${nonce}:${timestamp}`,
    };

    const paypayResponse = await axios.post(
      "https://stg-api.paypay.ne.jp/v2/payments",
      body,
      { headers }
    );

    return new Response(JSON.stringify(paypayResponse.data), { status: 200 });

  } catch (error) {
    console.error(error.response?.data || error);
    return new Response(JSON.stringify({ error: "PayPay API error", details: error.response?.data }), {
      status: 500,
    });
  }
}
