import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/prisma/bookings";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { getAuthUser } from "@/lib/supabase/server";
import puppeteer from "puppeteer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const operatorUser = await getOperatorBySupabaseId(user.id);

    if (!operatorUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await getBookingById(
      bookingId,
      operatorUser.operator.id
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const html = generateBookingHTML(
      booking,
      operatorUser.operator
    );

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=booking-${booking.reference}.pdf`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("PDF generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
      },
      {
        status: 500,
      }
    );
  }
}

function generateBookingHTML(booking: any, operator: any) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Booking PDF</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }

        .header {
          border-bottom: 2px solid #b08d57;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .title {
          font-size: 20px;
          font-weight: bold;
        }

        .section {
          margin-top: 20px;
        }

        .label {
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .value {
          font-size: 14px;
          font-weight: bold;
        }
      </style>
    </head>

    <body>
      <div class="header">
        <div class="title">Safari Booking Document</div>
        <div>${operator.name} · SafariTu</div>
      </div>

      <div class="section">
        <div class="label">Booking Reference</div>
        <div class="value">${booking.reference ?? ""}</div>
      </div>

      <div class="section">
        <div class="label">Guest</div>
        <div class="value">
          ${booking.customer?.firstName ?? ""}
          ${booking.customer?.lastName ?? ""}
        </div>
      </div>

      <div class="section">
        <div class="label">Safari</div>
        <div class="value">
          ${booking.tour?.title ?? ""}
        </div>
      </div>

      <div class="section">
        <div class="label">Total Amount</div>
        <div class="value">
          ${booking.totalAmount ?? 0}
          ${booking.currency ?? ""}
        </div>
      </div>
    </body>
  </html>
  `;
}