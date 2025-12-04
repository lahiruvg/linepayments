import { NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";

const PAYPAY_BASE_URL = "https://stg-api.sandbox.paypay.ne.jp";
const API_KEY = process.env.PAYPAY_API_KEY;
const API_SECRET = process.env.PAYPAY_API_SECRET;
const MERCHANT_ID = process.env.PAYPAY_MERCHANT_ID;

function buildHmacGetHeader(path) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const epoch = Math.floor(Date.now() / 1000).toString();
  const contentType = "empty";
  const hash = "empty";

  const dataToSign = [path, "GET", nonce, epoch, contentType, hash].join("\n");
  const mac = crypto.createHmac("sha256", API_SECRET).update(dataToSign).digest("base64");

  return `hmac OPA-Auth:${API_KEY}:${mac}:${nonce}:${epoch}:${hash}`;
}

export async function GET(req) {
  try {
    const merchantPaymentId = req.nextUrl.searchParams.get("id");

    if (!merchantPaymentId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const path = `/v2/payments/${merchantPaymentId}`;

    const result = await axios.get(PAYPAY_BASE_URL + path, {
      headers: {
        Authorization: buildHmacGetHeader(path),
        "X-ASSUME-MERCHANT": MERCHANT_ID,
      },
    });

    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json(
      { error: err.response?.data || "Unknown error" },
      { status: 500 }
    );
  }
}
