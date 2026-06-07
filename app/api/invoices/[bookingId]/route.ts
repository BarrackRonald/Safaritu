// app/api/invoices/[bookingId]/route.ts
// Generates a PDF invoice for a booking.
// Uses react-pdf (already installed) instead of puppeteer.

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { prisma } from "@/lib/prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { bookingId } = await params;

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const operatorUser = await getOperatorBySupabaseId(user.id);
    if (!operatorUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const booking = await prisma.booking.findFirst({
      where:   { id: bookingId, operatorId: operatorUser.operator.id },
      include: {
        tour:      { select: { title: true, location: true } },
        departure: { select: { startDate: true, endDate: true } },
        customer:  { select: { firstName: true, lastName: true, email: true, phone: true, country: true } },
        payments:  { where: { status: "PAID" } },
        operator:  { select: { name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Generate HTML invoice — browser can print/save as PDF
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${booking.reference}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; color: #1c1917; padding: 0 20px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #92400e; }
    .brand { color: #92400e; }
    .brand h1 { margin: 0; font-size: 24px; }
    .brand p { margin: 4px 0 0; font-size: 11px; color: #a16207; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta .ref { font-size: 20px; font-weight: 700; color: #92400e; }
    .section { margin-bottom: 28px; }
    .section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; }
    td:last-child { text-align: right; font-weight: 600; }
    .total td { font-weight: 700; font-size: 16px; border-top: 2px solid #1c1917; border-bottom: none; padding-top: 12px; }
    .paid { color: #16a34a; }
    .balance { color: #92400e; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #78716c; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>SafariTu</h1>
      <p>Only Safaris</p>
      <p style="margin-top:8px;font-size:13px;color:#44403c;text-transform:none;letter-spacing:0">${booking.operator.name}</p>
    </div>
    <div class="invoice-meta">
      <div style="font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:1px">Invoice / Receipt</div>
      <div class="ref">${booking.reference}</div>
      <div style="font-size:12px;color:#78716c;margin-top:4px">Issued: ${formatDate(new Date())}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
    <div class="section">
      <h3>Billed To</h3>
      <p style="margin:0;font-size:14px;font-weight:600">${booking.customer.firstName} ${booking.customer.lastName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#78716c">${booking.customer.email}</p>
      ${booking.customer.phone ? `<p style="margin:2px 0 0;font-size:13px;color:#78716c">${booking.customer.phone}</p>` : ""}
      ${booking.customer.country ? `<p style="margin:2px 0 0;font-size:13px;color:#78716c">${booking.customer.country}</p>` : ""}
    </div>
    <div class="section">
      <h3>Trip Details</h3>
      <p style="margin:0;font-size:14px;font-weight:600">${booking.tour.title}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#78716c">${booking.tour.location ?? "East Africa"}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#78716c">${formatDate(booking.departure.startDate)} → ${formatDate(booking.departure.endDate)}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#78716c">${booking.partySize} guest${booking.partySize !== 1 ? "s" : ""}</p>
    </div>
  </div>

  <div class="section">
    <h3>Payment Summary</h3>
    <table>
      <tr><td>Safari — ${booking.tour.title}</td><td>${formatCurrency(Number(booking.totalAmount), booking.currency)}</td></tr>
      <tr><td>Guests</td><td>${booking.partySize}</td></tr>
      <tr><td>Deposit paid</td><td class="paid">${formatCurrency(Number(booking.depositAmount), booking.currency)}</td></tr>
      ${Number(booking.balanceDue) > 0 ? `<tr><td>Balance due before departure</td><td class="balance">${formatCurrency(Number(booking.balanceDue), booking.currency)}</td></tr>` : ""}
      <tr class="total"><td>Total</td><td>${formatCurrency(Number(booking.totalAmount), booking.currency)}</td></tr>
    </table>
  </div>

  ${booking.payments.length > 0 ? `
  <div class="section">
    <h3>Payment Transactions</h3>
    <table>
      ${booking.payments.map((p) => `
        <tr>
          <td>${p.provider} ${p.providerReference ? `(${p.providerReference})` : ""} — ${formatDate(p.paidAt ?? p.createdAt)}</td>
          <td class="paid">${formatCurrency(Number(p.amount), p.currency)}</td>
        </tr>
      `).join("")}
    </table>
  </div>
  ` : ""}

  <footer>
    <p>Thank you for booking with ${booking.operator.name} via SafariTu.</p>
    <p>${booking.operator.email}${booking.operator.phone ? ` · ${booking.operator.phone}` : ""}</p>
    <p style="margin-top:8px;color:#a16207;font-weight:600">SafariTu — Only Safaris</p>
  </footer>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[GET /api/invoices/[bookingId]]", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}