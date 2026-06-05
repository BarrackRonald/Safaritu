// lib/email/index.ts
// Sends transactional emails via Resend.
// Two emails per booking: one to the traveler, one to the operator.
import "server-only";
import { Resend } from "resend";
import { formatCurrency, formatDateRange } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

type BookingEmailData = {
  booking: {
    reference:    string;
    totalAmount:  number;
    depositAmount:number;
    balanceDue:   number;
    currency:     string;
    partySize:    number;
  };
  tour: {
    title:        string;
    location:     string | null;
    durationDays: number;
  };
  departure: {
    startDate:    Date | string;
    endDate:      Date | string;
  };
  customer: {
    firstName:    string;
    lastName:     string;
    email:        string;
  };
  operator: {
    name:         string;
    email:        string;
    phone:        string | null;
  };
};

// ── Traveler confirmation email ───────────────────────────────────────────────

export async function sendBookingConfirmationToTraveler(data: BookingEmailData) {
  const { booking, tour, departure, customer, operator } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#92400e;padding:32px 40px;text-align:center">
      <p style="margin:0;color:#fcd34d;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase">SafariTu — Only Safaris</p>
      <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:700">Booking Confirmed 🦁</h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px">
      <p style="margin:0 0 20px;color:#44403c;font-size:15px">
        Hi ${customer.firstName},<br><br>
        Your safari is booked! Here's everything you need to know.
      </p>

      <!-- Booking reference -->
      <div style="background:#fef9f0;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
        <p style="margin:0;color:#78350f;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Booking Reference</p>
        <p style="margin:6px 0 0;color:#92400e;font-size:28px;font-weight:700;letter-spacing:2px">${booking.reference}</p>
      </div>

      <!-- Trip details -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#78716c;font-size:13px;width:40%">Safari</td>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#1c1917;font-size:13px;font-weight:600">${tour.title}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#78716c;font-size:13px">Dates</td>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#1c1917;font-size:13px;font-weight:600">${formatDateRange(departure.startDate, departure.endDate)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#78716c;font-size:13px">Location</td>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#1c1917;font-size:13px;font-weight:600">${tour.location ?? "East Africa"}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#78716c;font-size:13px">Guests</td>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#1c1917;font-size:13px;font-weight:600">${booking.partySize} guest${booking.partySize !== 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#78716c;font-size:13px">Operator</td>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#1c1917;font-size:13px;font-weight:600">${operator.name}</td>
        </tr>
      </table>

      <!-- Payment summary -->
      <div style="background:#f5f5f4;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;color:#44403c;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Payment Summary</p>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#78716c;font-size:13px">Total safari cost</span>
          <span style="color:#1c1917;font-size:13px;font-weight:600">${formatCurrency(booking.totalAmount, booking.currency)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#78716c;font-size:13px">Deposit paid</span>
          <span style="color:#16a34a;font-size:13px;font-weight:600">${formatCurrency(booking.depositAmount, booking.currency)} ✓</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e5e5">
          <span style="color:#1c1917;font-size:13px;font-weight:700">Balance due before departure</span>
          <span style="color:#92400e;font-size:13px;font-weight:700">${formatCurrency(booking.balanceDue, booking.currency)}</span>
        </div>
      </div>

      <!-- Next steps -->
      <div style="margin-bottom:24px">
        <p style="margin:0 0 12px;color:#44403c;font-size:14px;font-weight:700">What happens next?</p>
        <ol style="margin:0;padding-left:20px;color:#78716c;font-size:13px;line-height:1.8">
          <li>Your operator <strong>${operator.name}</strong> will contact you within 24 hours with trip details.</li>
          <li>Pay the balance of <strong>${formatCurrency(booking.balanceDue, booking.currency)}</strong> at least 7 days before departure.</li>
          <li>Pack your bags and get ready for an amazing safari! 🦁</li>
        </ol>
      </div>

      <!-- Operator contact -->
      ${operator.phone ? `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;color:#15803d;font-size:13px;font-weight:700">Contact your operator</p>
        <p style="margin:6px 0 0;color:#166534;font-size:13px">${operator.name} · <a href="tel:${operator.phone}" style="color:#166534">${operator.phone}</a> · <a href="mailto:${operator.email}" style="color:#166534">${operator.email}</a></p>
      </div>
      ` : ""}

    </div>

    <!-- Footer -->
    <div style="background:#fef9f0;padding:24px 40px;text-align:center;border-top:1px solid #fed7aa">
      <p style="margin:0;color:#a16207;font-size:12px">
        SafariTu — Only Safaris<br>
        <span style="color:#92400e">East Africa&apos;s safari marketplace</span>
      </p>
    </div>

  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      customer.email,
      subject: `Booking confirmed — ${tour.title} [${booking.reference}]`,
      html,
    });
  } catch (error) {
    // Email failure should never block the booking — log and continue
    console.error("[email] Failed to send traveler confirmation:", error);
  }
}

// ── Operator notification email ────────────────────────────────────────────────

export async function sendBookingNotificationToOperator(data: BookingEmailData) {
  const { booking, tour, departure, customer, operator } = data;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#f5f5f4;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <div style="background:#1c1917;padding:24px 32px">
      <p style="margin:0;color:#fcd34d;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SafariTu Operator Alert</p>
      <h2 style="margin:8px 0 0;color:#ffffff;font-size:20px">New booking received 🎉</h2>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 16px;color:#44403c;font-size:14px">
        <strong>${customer.firstName} ${customer.lastName}</strong> just booked <strong>${tour.title}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${[
          ["Reference",    booking.reference],
          ["Guest",        `${customer.firstName} ${customer.lastName} · ${customer.email}`],
          ["Safari",       tour.title],
          ["Dates",        formatDateRange(departure.startDate, departure.endDate)],
          ["Party size",   `${booking.partySize} guest${booking.partySize !== 1 ? "s" : ""}`],
          ["Deposit paid", formatCurrency(booking.depositAmount, booking.currency)],
          ["Balance due",  formatCurrency(booking.balanceDue, booking.currency)],
          ["Total",        formatCurrency(booking.totalAmount, booking.currency)],
        ].map(([label, value]) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f5f5f4;color:#78716c;width:40%">${label}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f5f5f4;color:#1c1917;font-weight:600">${value}</td>
          </tr>
        `).join("")}
      </table>
      <div style="margin-top:20px;padding:16px;background:#fef9f0;border-radius:10px">
        <p style="margin:0;color:#92400e;font-size:13px">
          Log in to your <strong>SafariTu dashboard</strong> to view the full booking and contact the guest.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      operator.email,
      subject: `New booking: ${tour.title} — ${booking.reference}`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send operator notification:", error);
  }
}