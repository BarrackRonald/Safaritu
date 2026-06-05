// lib/payments/mpesa.ts
// Safaricom Daraja API integration.
// Handles OAuth token, STK Push, and callback verification.
import "server-only";

const IS_SANDBOX = process.env.MPESA_ENVIRONMENT === "sandbox";

const BASE_URL = IS_SANDBOX
  ? "https://sandbox.safaricom.co.ke"
  : "https://api.safaricom.co.ke";

// ── OAuth token ───────────────────────────────────────────────────────────────
// Token expires in 1 hour. In production you'd cache this in Redis.
// For now we fetch a fresh one per request — acceptable for low volume.

export async function getMpesaAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method:  "GET",
      headers: { Authorization: `Basic ${credentials}` },
      cache:   "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mpesa token error: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── STK Push ──────────────────────────────────────────────────────────────────
// Sends an STK Push prompt to the customer's phone.
// They enter their Mpesa PIN to complete the payment.

export async function initiateStkPush({
  phone,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl,
}: {
  phone:            string;   // international format: 254XXXXXXXXX
  amount:           number;   // KES amount (must be integer)
  accountReference: string;   // e.g. booking reference "ST-2026-A4X2"
  transactionDesc:  string;   // e.g. "Safari deposit — Maasai Mara 3D/2N"
  callbackUrl:      string;
}) {
  const token     = await getMpesaAccessToken();
  const timestamp = generateTimestamp();
  const password  = generatePassword(timestamp);

  // Sanitise phone — ensure it starts with 254
  const sanitised = sanitisePhone(phone);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE!,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   "CustomerPayBillOnline",
    Amount:            Math.round(amount), // Mpesa only accepts integers
    PartyA:            sanitised,
    PartyB:            process.env.MPESA_SHORTCODE!,
    PhoneNumber:       sanitised,
    CallBackURL:       callbackUrl,
    AccountReference:  accountReference.slice(0, 12), // max 12 chars
    TransactionDesc:   transactionDesc.slice(0, 13),  // max 13 chars
  };

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STK push failed: ${res.status} — ${text}`);
  }

  const data = await res.json();

  // ResponseCode "0" = success (STK push sent to phone)
  if (data.ResponseCode !== "0") {
    throw new Error(`STK push declined: ${data.ResponseDescription}`);
  }

  return {
    merchantRequestId: data.MerchantRequestID as string,
    checkoutRequestId: data.CheckoutRequestID as string,
    responseDescription: data.ResponseDescription as string,
  };
}

// ── STK Push status query ─────────────────────────────────────────────────────
// Poll this to check if the user has completed payment.
// Used by the frontend polling interval after STK push is sent.

export async function queryStkStatus(checkoutRequestId: string) {
  const token     = await getMpesaAccessToken();
  const timestamp = generateTimestamp();
  const password  = generatePassword(timestamp);

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE!,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json();
  return data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
}

function generatePassword(timestamp: string): string {
  const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

function sanitisePhone(phone: string): string {
  // Remove spaces and dashes
  let p = phone.replace(/[\s\-]/g, "");
  // Convert 07XX → 2547XX
  if (p.startsWith("07") || p.startsWith("01")) {
    p = "254" + p.slice(1);
  }
  // Remove leading +
  if (p.startsWith("+")) {
    p = p.slice(1);
  }
  return p;
}