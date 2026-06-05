// lib/payments/stripe.ts
import "server-only";
import Stripe from "stripe";

// Singleton Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
  typescript:  true,
});

// Create a Stripe Checkout Session for a safari deposit payment
export async function createStripeCheckoutSession({
  tourId,
  tourTitle,
  departureId,
  operatorId,
  operatorStripeCustomerId,
  partySize,
  depositAmount,
  totalAmount,
  currency,
  customerEmail,
  customerName,
  successUrl,
  cancelUrl,
  metadata,
}: {
  tourId:                   string;
  tourTitle:                string;
  departureId:              string;
  operatorId:               string;
  operatorStripeCustomerId?: string | null;
  partySize:                number;
  depositAmount:            number;    // in base currency units (KES, USD etc.)
  totalAmount:              number;
  currency:                 string;
  customerEmail:            string;
  customerName:             string;
  successUrl:               string;
  cancelUrl:                string;
  metadata:                 Record<string, string>;
}) {
  // Stripe amounts are in the smallest currency unit
  // KES, TZS, UGX are zero-decimal currencies
  const ZERO_DECIMAL = ["KES", "TZS", "UGX", "BIF", "GNF", "RWF"];
  const isZeroDecimal = ZERO_DECIMAL.includes(currency.toUpperCase());
  const unitAmount    = isZeroDecimal
    ? Math.round(depositAmount)
    : Math.round(depositAmount * 100);

  const session = await stripe.checkout.sessions.create({
    mode:               "payment",
    payment_method_types: ["card"],
    customer_email:     customerEmail,
    line_items: [
      {
        quantity:    1,
        price_data: {
          currency:     currency.toLowerCase(),
          unit_amount:  unitAmount,
          product_data: {
            name:        `${tourTitle} — Deposit (${partySize} guest${partySize !== 1 ? "s" : ""})`,
            description: `Deposit payment. Remaining balance of ${currency} ${(totalAmount - depositAmount).toLocaleString()} due before departure.`,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    metadata: {
      ...metadata,
      tourId,
      departureId,
      operatorId,
      partySize:     String(partySize),
      depositAmount: String(depositAmount),
      totalAmount:   String(totalAmount),
      currency,
    },
  });

  return session;
}

// Verify and construct a Stripe webhook event
export function constructStripeWebhookEvent(
  payload:   string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}