// app/api/webhook/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// --- CONFIGURATION ---
// IMPORTANT: Use your actual Stripe Secret Key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string; 

// IMPORTANT: Use the Webhook Signing Secret you obtained from the Stripe CLI (whsec_...)
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string; 

// Initialize Stripe instance (use the API version you confirmed works, e.g., '2025-11-17.clover')
const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover' as any, // Replace with your version if different
});

// --- API HANDLER ---

export async function POST(req: Request) {
    if (!WEBHOOK_SECRET) {
        return new NextResponse('Webhook secret not configured.', { status: 500 });
    }

    // 1. Get the signature from the request header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        return new NextResponse('Missing stripe-signature header', { status: 400 });
    }

    // 2. Read the raw body stream
    const rawBody = await req.text();
    let event: Stripe.Event;

    // 3. Verify the event using the secret and the raw body
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // 4. Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`PaymentIntent successful: ${paymentIntent.id}`);
            
            // 🚨 FULFILL ORDER LOGIC GOES HERE 🚨
            // - Update your database (mark order as 'paid')
            // - Send confirmation emails
            // - Begin shipping process
            // The paymentIntent.id or associated metadata holds your order details.
            
            break;
        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object as Stripe.PaymentIntent;
            console.error(`PaymentIntent failed: ${failedIntent.id}`);
            // 🚨 HANDLE FAILED PAYMENT LOGIC 🚨
            break;
        case 'checkout.session.completed':
            // If you used Checkout Session API, this handles the confirmation
            break;
        // Handle other event types if necessary...
        default:
            console.warn(`Unhandled event type ${event.type}`);
    }

    // 5. Return a 200 response to acknowledge receipt of the event
    return new NextResponse(null, { status: 200 });
}