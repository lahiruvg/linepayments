import crypto from "crypto";

const PAYPAY_BASE_URL = "https://stg-api.sandbox.paypay.ne.jp";
const JSON_CONTENT_TYPE = "application/json;charset=UTF-8";

const API_KEY = process.env.PAYPAY_API_KEY;
const API_SECRET = process.env.PAYPAY_API_SECRET;
const MERCHANT_ID = process.env.PAYPAY_MERCHANT_ID;

/**
 * Build correct PayPay HMAC Signature (working version)
 */
function buildHmacAuthHeader({ apiKey, apiSecret, method, path, body }) {
  const httpMethod = method.toUpperCase();
  const epoch = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  let contentType;
  let hash;
  let bodyString = "";

  const hasBody =
    body &&
    (httpMethod === "POST" || httpMethod === "PUT" || httpMethod === "PATCH");

  if (hasBody) {
    bodyString = JSON.stringify(body);

    contentType = JSON_CONTENT_TYPE;

    const md5 = crypto.createHash("md5");
    md5.update(contentType, "utf8");
    md5.update(bodyString, "utf8");
    hash = md5.digest("base64");
  } else {
    contentType = "empty";
    hash = "empty";
  }

  const dataToSign = [
    path,
    httpMethod,
    nonce,
    epoch,
    contentType,
    hash
  ].join("\n");

  const macData = crypto
    .createHmac("sha256", apiSecret)
    .update(dataToSign, "utf8")
    .digest("base64");

  const authHeader = `hmac OPA-Auth:${apiKey}:${macData}:${nonce}:${epoch}:${hash}`;

  return {
    authHeader,
    contentType,
    bodyString
  };
}

export async function POST(req) {
  try {
    if (!API_KEY || !API_SECRET || !MERCHANT_ID) {
      return Response.json(
        {
          error: "Missing PayPay credentials",
          PAYPAY_API_KEY: !!API_KEY,
          PAYPAY_API_SECRET: !!API_SECRET,
          PAYPAY_MERCHANT_ID: !!MERCHANT_ID
        },
        { status: 500 }
      );
    }

    const { amount = 10, description = "PayPay web payment test" } =
      await req.json();

    const path = "/v2/codes";

    const payload = {
      merchantPaymentId: `mp_${Date.now()}`,
      amount: { amount, currency: "JPY" },
      codeType: "ORDER_QR",
      orderDescription: description,
      isAuthorization: false,
      redirectUrl: "http://localhost:3000/payment-result",
      redirectType: "WEB_LINK",
      userAgent: "Mozilla/5.0 (Next.js Server)",
      requestedAt: Math.floor(Date.now() / 1000)
    };

    const { authHeader } = buildHmacAuthHeader({
      apiKey: API_KEY,
      apiSecret: API_SECRET,
      method: "POST",
      path,
      body: payload
    });

    const headers = {
      "Content-Type": JSON_CONTENT_TYPE,
      "X-ASSUME-MERCHANT": MERCHANT_ID,
      Authorization: authHeader
    };

    const response = await fetch(`${PAYPAY_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return Response.json(
      {
        status: response.status,
        raw: data
      },
      { status: response.status }
    );
  } catch (err) {
    return Response.json(
      {
        message: "PayPay integration error",
        error: err.message
      },
      { status: 500 }
    );
  }
}
