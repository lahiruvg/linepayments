import { NextResponse } from "next/server";
import crypto from "crypto";

// === Helpers for HMAC ===
function computeBodyHash(contentType, bodyString) {
  if (!bodyString) return "empty";
  const md5 = crypto.createHash("md5");
  md5.update(contentType, "utf8");
  md5.update(bodyString, "utf8");
  return md5.digest("base64");
}

function computeHmacBase64(secret, data) {
  return crypto.createHmac("sha256", secret).update(data, "utf8").digest("base64");
}

function buildHmacAuthHeader({ apiKey, apiSecret, requestPath, httpMethod, contentType, bodyString }) {
  const nonce = crypto.randomBytes(6).toString("hex"); // 12-char random
  const epochSeconds = Math.floor(Date.now() / 1000).toString();
  const bodyHash = computeBodyHash(contentType, bodyString);
  const DELIM = "\n";

  const signingString = [
    requestPath,       // path only
    httpMethod,        // e.g., POST
    nonce,
    epochSeconds,
    contentType,
    bodyHash
  ].join(DELIM);

  const mac = computeHmacBase64(apiSecret, signingString);

  return `hmac OPA-Auth:${apiKey}:${mac}:${nonce}:${epochSeconds}:${bodyHash}`;
}

// === API Route ===
export async function POST(req) {
  try {
    const API_KEY = process.env.PAYPAY_API_KEY;
    const API_SECRET = process.env.PAYPAY_API_SECRET;
    if (!API_KEY || !API_SECRET) {
      return NextResponse.json({ error: "Missing PAYPAY_API_KEY or PAYPAY_API_SECRET" }, { status: 500 });
    }

    const requestPath = "/v2/codes"; // only path portion
    const httpMethod = "POST";
    const contentType = "application/json;charset=UTF-8";

    const merchantPaymentId = `test_${Date.now()}`;
    const bodyObj = {
      merchantPaymentId,
      amount: { amount: 100, currency: "JPY" },
      codeType: "ORDER_QR",
      isAuthorization: false,
      redirectUrl: "https://endoscopic-burma-pretelephonic.ngrok-free.dev/payment-result",
      redirectType: "WEB_LINK"
    };

    const bodyString = JSON.stringify(bodyObj);

    const authHeader = buildHmacAuthHeader({
      apiKey: API_KEY,
      apiSecret: API_SECRET,
      requestPath,
      httpMethod,
      contentType,
      bodyString
    });

    const response = await fetch(`https://sandbox-api.paypay.ne.jp${requestPath}`, {
      method: httpMethod,
      headers: {
        "Content-Type": contentType,
        "Authorization": authHeader,
        "X-API-KEY": API_KEY
      },
      body: bodyString
    });


    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
