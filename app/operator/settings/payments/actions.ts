"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOperatorBySupabaseId } from "@/lib/prisma/operator";

import {
  MASKED_SENTINEL,
  type PaymentSettingsState,
} from "./utils";

export async function savePaymentSettings(
  _prev: PaymentSettingsState,
  formData: FormData
): Promise<PaymentSettingsState> {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const operatorUser = await getOperatorBySupabaseId(user.id);

  if (!operatorUser) {
    redirect("/login");
  }

  const operatorId = operatorUser.operator.id;

  const existing = await prisma.operatorPaymentConfig.findUnique({
    where: { operatorId },
  });

  const resolve = (
    field: string,
    existingValue: string | null
  ): string | null => {
    const value = formData.get(field) as string | null;

    if (!value || value.trim() === "") {
      return null;
    }

    if (value === MASKED_SENTINEL) {
      return existingValue;
    }

    return value.trim();
  };

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
        mpesaAccountPrefix:
          (formData.get("mpesaAccountPrefix") as string) || "BOOKING",

        // Daraja credentials
        mpesaConsumerKey: resolve("mpesaConsumerKey", null),
        mpesaConsumerSecret: resolve("mpesaConsumerSecret", null),
        mpesaPasskey: resolve("mpesaPasskey", null),
        mpesaShortcode: resolve("mpesaShortcode", null),
        mpesaEnvironment:
          (formData.get("mpesaEnvironment") as string) || "sandbox",
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
        mpesaPaybill: resolve(
          "mpesaPaybill",
          existing?.mpesaPaybill ?? null
        ),
        mpesaTill: resolve(
          "mpesaTill",
          existing?.mpesaTill ?? null
        ),
        mpesaAccountPrefix:
          (formData.get("mpesaAccountPrefix") as string) || "BOOKING",

        // Daraja credentials
        mpesaConsumerKey: resolve(
          "mpesaConsumerKey",
          existing?.mpesaConsumerKey ?? null
        ),
        mpesaConsumerSecret: resolve(
          "mpesaConsumerSecret",
          existing?.mpesaConsumerSecret ?? null
        ),
        mpesaPasskey: resolve(
          "mpesaPasskey",
          existing?.mpesaPasskey ?? null
        ),
        mpesaShortcode: resolve(
          "mpesaShortcode",
          existing?.mpesaShortcode ?? null
        ),
        mpesaEnvironment:
          (formData.get("mpesaEnvironment") as string) || "sandbox",
        mpesaCallbackUrl: resolve(
          "mpesaCallbackUrl",
          existing?.mpesaCallbackUrl ?? null
        ),

        // Stripe
        stripeEnabled,
        stripePublishableKey: resolve(
          "stripePublishableKey",
          existing?.stripePublishableKey ?? null
        ),
        stripeSecretKey: resolve(
          "stripeSecretKey",
          existing?.stripeSecretKey ?? null
        ),
        stripeWebhookSecret: resolve(
          "stripeWebhookSecret",
          existing?.stripeWebhookSecret ?? null
        ),
      },
    });

    revalidatePath("/operator/settings/payments");

    return {
      success: true,
    };
  } catch (error) {
    console.error("[savePaymentSettings]", error);

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save payment settings.",
    };
  }
}