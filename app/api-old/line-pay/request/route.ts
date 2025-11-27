// app/api/line-pay/request/route.ts
// Handles the request to the LINE Pay server to start a payment session.

import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Needed for HMAC-SHA256 signature
import { v4 as uuidv4 } from 'uuid'; // Needed for the Nonce (if using Next.js, ensure 'uuid' is installed)

// --- CONFIGURATION ---
// Load environment variables (ensure these are set in .env.local)
const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID as string;
const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET as string;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string; // Your Ngrok URL

// API Details
const API_VERSION = '/v3';
const REQUEST_ENDPOINT = '/payments/request';
const API_URL = `https://sandbox-api-pay.line.me${API_VERSION}${REQUEST_ENDPOINT}`;

// --- SIGNATURE GENERATION UTILITY ---

/**
 * Calculates the required X-LINE-Authorization signature for the request.
 * The signature is a Base64-encoded HMAC-SHA256 hash.
 * @param secret The Channel Secret Key.
 * @param path The full API path including version and endpoint (e.g., /v3/payments/request).
 * @param body The JSON body string of the request.
 * @param nonce The X-LINE-Authorization-Nonce value.
 * @returns The Base64-encoded signature string.
 */
const generateLinePaySignature = (secret: string, path: string, body: string, nonce: string): string => {
    // 1. Concatenate the required components
    const signatureBase = secret + path + body + nonce;

    // 2. Calculate HMAC-SHA256 hash using the secret as the key
    const hash = crypto.createHmac('sha256', secret)
        .update(signatureBase)
        .digest('base64');
    
    // 3. The result is the final signature
    return hash;
};

// --- API HANDLER ---

export async function POST(req: Request) {
    console.log("DEBUG: Channel ID Loaded?", !!CHANNEL_ID); 
    console.log("DEBUG: Secret Loaded?", !!CHANNEL_SECRET);
    
    if (!CHANNEL_ID || !CHANNEL_SECRET || !BASE_URL) {
        return NextResponse.json({ 
            message: 'Server configuration error: Missing LINE Pay credentials or BASE_URL.', 
            details: { channelIdSet: !!CHANNEL_ID, baseUrlSet: !!BASE_URL }
        }, { status: 500 });
    }

    try {
        const { amount, orderId, packages } = await req.json();

        // 1. Construct the Request Body
        const requestBody = {
            amount: amount, 
            currency: "JPY",
            orderId: orderId,
            packages: packages, 
            redirectUrls: {
                confirmUrl: `${BASE_URL}/api/line-pay/confirm`, 
                cancelUrl: `${BASE_URL}/checkout/cancel`,
            }
        };

        const requestBodyString = JSON.stringify(requestBody);

        // 2. Generate Nonce
        const nonce = uuidv4();

        // 3. Calculate Signature
        const signature = generateLinePaySignature(
            CHANNEL_SECRET,
            `${API_VERSION}${REQUEST_ENDPOINT}`,
            requestBodyString,
            nonce
        );

        // See the complex logic required for authentication:
        

        // 4. Send Request with Correct Headers
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-LINE-ChannelId': CHANNEL_ID,
                // The correct Nonce header
                'X-LINE-Authorization-Nonce': nonce, 
                // The correct Signature header that uses the secret for hashing
                'X-LINE-Authorization': signature, 
                // NOTE: The previous incorrect header 'X-LINE-ChannelSecret' is removed.
            },
            body: requestBodyString,
        });

        const data = await response.json();

        if (data.returnCode === '0000') {
            // Success: Return the redirect URL and transaction ID to the frontend
            return NextResponse.json({ 
                paymentUrl: data.info.paymentUrl.web, 
                transactionId: data.info.transactionId 
            }, { status: 200 });
        } else {
            // Failure in the LINE Pay API call
            console.error('LINE Pay Request Failed:', data);
            return NextResponse.json({ message: 'LINE Pay Request Failed', details: data }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in payment request API:', error);
        return NextResponse.json({ message: 'Internal Server Error during fetch' }, { status: 500 });
    }
}