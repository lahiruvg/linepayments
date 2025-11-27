// app/api/line-pay/confirm/route.ts

import { NextResponse } from 'next/server';

const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID as string;
const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET as string;

const API_BASE_URL = "https://sandbox-api-pay.line.me/v3/payments"; 

export async function GET(req: Request) {
    const url = new URL(req.url);
    const transactionId = url.searchParams.get('transactionId');
    const orderId = url.searchParams.get('orderId'); 
    
    // ⚠️ CRITICAL: The amount must be the exact amount from the Request step. 
    // In a real app, this should be fetched from a database based on orderId.
    const amount = 5500; 
    const currency = "JPY"; 

    if (!transactionId) {
        return NextResponse.redirect(new URL(`/checkout/failure?reason=missing_id`, url));
    }

    const API_CONFIRM_URL = `${API_BASE_URL}/${transactionId}/confirm`;

    try {
        // Send the confirmation request back to the LINE Pay Sandbox API
        const response = await fetch(API_CONFIRM_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-LINE-ChannelId': CHANNEL_ID,
                'X-LINE-ChannelSecret': CHANNEL_SECRET,
            },
            body: JSON.stringify({ amount, currency }),
        });

        const data = await response.json();

        if (data.returnCode === '0000') {
            // Success: Update your order status here.
            return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, url));
        } else {
            console.error('LINE Pay Confirmation Failed:', data);
            return NextResponse.redirect(new URL(`/checkout/failure?orderId=${orderId}&code=${data.returnCode}`, url));
        }
    } catch (error) {
        console.error('Confirmation API error:', error);
        return NextResponse.redirect(new URL(`/checkout/failure?code=API_ERROR`, url));
    }
}