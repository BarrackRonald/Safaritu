import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/prisma/bookings";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getAuthUser } from "@/lib/supabase/server";
import puppeteer from "puppeteer";

export async function GET(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await getBookingById(params.bookingId, operatorUser.operator.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const html = generateBookingHTML(booking, operatorUser.operator);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=booking-${booking.reference}.pdf`,
    },
  });
}

function generateBookingHTML(booking: any, operator: any) {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial; padding: 40px; }
        .header { border-bottom: 2px solid #b08d57; padding-bottom: 10px; }
        .title { font-size: 20px; font-weight: bold; }
        .section { margin-top: 20px; }
        .label { color: #666; font-size: 12px; }
        .value { font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="title">Safari Booking Document</div>
        <div>${operator.name} · SafariTu</div>
      </div>

      <div class="section">
        <div class="label">Booking Reference</div>
        <div class="value">${booking.reference}</div>
      </div>

      <div class="section">
        <div class="label">Guest</div>
        <div class="value">${booking.customer.firstName} ${booking.customer.lastName}</div>
      </div>

      <div class="section">
        <div class="label">Safari</div>
        <div class="value">${booking.tour.title}</div>
      </div>

      <div class="section">
        <div class="label">Total Amount</div>
        <div class="value">${booking.totalAmount} ${booking.currency}</div>
      </div>

    </body>
  </html>
  `;
}