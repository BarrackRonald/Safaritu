// app/operator/settings/payments/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";

// Sentinel value — if the client sends this back we know the user
// didn't touch the field, so we keep the existing DB value.
export const MASKED_SENTINEL = "••••••••";

export type PaymentSettingsState = {
  success?: boolean;
  error?: string;
};

export async function savePaymentSettings(
  _prev: PaymentSettingsState,
  formData: FormData
): Promise<PaymentSettingsState> {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const operatorUser = await getOperatorBySupabaseId(user.id);
  if (!operatorUser) redirect("/login");

  const operatorId = operatorUser.operator.id;

  // Load existing config so we can keep masked fields unchanged
  const existing = await prisma.operatorPaymentConfig.findUnique({
    where: { operatorId },
  });

  function resolve(field: string, existingValue: string | null): string | null {
    const val = formData.get(field) as string | null;
    if (!val || val.trim() === "") return null;
    if (val === MASKED_SENTINEL) return existingValue; // unchanged
    return val.trim();
  }

  const mpesaEnabled = formData.get("mpesaEnabled") === "on";
  const stripeEnabled = formData.get("stripeEnabled") === "on";

  try {
    await prisma.operatorPaymentConfig.upsert({
      where: { operatorId },
      create: {
        operatorId,
        // M-Pesa display
        mpesaEnabled,
        mpesaPaybill: resolve("mpesaPaybill", null),
        mpesaTill: resolve("mpesaTill", null),
        mpesaAccountPrefix: (formData.get("mpesaAccountPrefix") as string) || "BOOKING",
        // M-Pesa Daraja secrets
        mpesaConsumerKey: resolve("mpesaConsumerKey", null),
        mpesaConsumerSecret: resolve("mpesaConsumerSecret", null),
        mpesaPasskey: resolve("mpesaPasskey", null),
        mpesaShortcode: resolve("mpesaShortcode", null),
        mpesaEnvironment: (formData.get("mpesaEnvironment") as string) || "sandbox",
        mpesaCallbackUrl: resolve("mpesaCallbackUrl", null),
        // Stripe
        stripeEnabled,
        stripePublishableKey: resolve("stripePublishableKey", null),
        stripeSecretKey: resolve("stripeSecretKey", null),
        stripeWebhookSecret: resolve("stripeWebhookSecret", null),
      },
      update: {
        // M-Pesa display
        mpesaEnabled,
        mpesaPaybill: resolve("mpesaPaybill", existing?.mpesaPaybill ?? null),
        mpesaTill: resolve("mpesaTill", existing?.mpesaTill ?? null),
        mpesaAccountPrefix: (formData.get("mpesaAccountPrefix") as string) || "BOOKING",
        // M-Pesa Daraja secrets — only update if user typed a new value
        mpesaConsumerKey: resolve("mpesaConsumerKey", existing?.mpesaConsumerKey ?? null),
        mpesaConsumerSecret: resolve("mpesaConsumerSecret", existing?.mpesaConsumerSecret ?? null),
        mpesaPasskey: resolve("mpesaPasskey", existing?.mpesaPasskey ?? null),
        mpesaShortcode: resolve("mpesaShortcode", existing?.mpesaShortcode ?? null),
        mpesaEnvironment: (formData.get("mpesaEnvironment") as string) || "sandbox",
        mpesaCallbackUrl: resolve("mpesaCallbackUrl", existing?.mpesaCallbackUrl ?? null),
        // Stripe
        stripeEnabled,
        stripePublishableKey: resolve("stripePublishableKey", existing?.stripePublishableKey ?? null),
        stripeSecretKey: resolve("stripeSecretKey", existing?.stripeSecretKey ?? null),
        stripeWebhookSecret: resolve("stripeWebhookSecret", existing?.stripeWebhookSecret ?? null),
      },
    });

    revalidatePath("/operator/settings/payments");
    return { success: true };
  } catch (err: any) {
    console.error("[savePaymentSettings]", err);
    return { error: err.message ?? "Failed to save settings." };
  }
}

// Helper to mask a secret — returns "••••••••" + last 4 chars
export function maskSecret(value: string | null): string {
  if (!value) return "";
  if (value.length <= 4) return MASKED_SENTINEL;
  return MASKED_SENTINEL + value.slice(-4);
}