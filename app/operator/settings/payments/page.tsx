// app/operator/settings/payments/page.tsx
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";
import { prisma } from "@/lib/prisma";
import OperatorShell from "@/components/layout/OperatorShell";
import PaymentSettingsForm from "./PaymentSettingsForm";
import { maskSecret } from "./actions";

export const metadata = { title: "Payment Settings — SafariTu" };
export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const config = await prisma.operatorPaymentConfig.findUnique({
    where: { operatorId: operatorUser.operator.id },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.com";
  const defaultCallbackUrl = `${appUrl}/api/bookings/mpesa/callback`;
  const defaultWebhookUrl  = `${appUrl}/api/bookings/stripe/webhook`;

  // Build safe display config — secrets are masked before reaching the client
  const displayConfig = {
    mpesaEnabled:       config?.mpesaEnabled       ?? false,
    mpesaPaybill:       config?.mpesaPaybill        ?? "",
    mpesaTill:          config?.mpesaTill           ?? "",
    mpesaAccountPrefix: config?.mpesaAccountPrefix  ?? "BOOKING",
    mpesaShortcode:     config?.mpesaShortcode      ?? "",
    mpesaEnvironment:   config?.mpesaEnvironment    ?? "sandbox",
    mpesaCallbackUrl:   config?.mpesaCallbackUrl    ?? "",
    // Secrets — masked
    mpesaConsumerKey:    maskSecret(config?.mpesaConsumerKey    ?? null),
    mpesaConsumerSecret: maskSecret(config?.mpesaConsumerSecret ?? null),
    mpesaPasskey:        maskSecret(config?.mpesaPasskey        ?? null),
    // Stripe
    stripeEnabled:        config?.stripeEnabled        ?? false,
    stripePublishableKey: config?.stripePublishableKey ?? "",
    stripeSecretKey:      maskSecret(config?.stripeSecretKey      ?? null),
    stripeWebhookSecret:  maskSecret(config?.stripeWebhookSecret  ?? null),
  };

  return (
    <OperatorShell operator={operatorUser.operator}>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Payment Settings</h1>
          <p className="text-stone-500 text-sm mt-1">
            Configure how you accept payments from travellers. Each method is independent.
          </p>
        </div>

        <PaymentSettingsForm
          config={displayConfig}
          defaultCallbackUrl={defaultCallbackUrl}
          defaultWebhookUrl={defaultWebhookUrl}
        />
      </div>
    </OperatorShell>
  );
}