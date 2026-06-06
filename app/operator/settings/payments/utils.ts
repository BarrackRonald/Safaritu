export const MASKED_SENTINEL = "••••••••";

export type PaymentSettingsState = {
  success?: boolean;
  error?: string;
};

/**
 * Masks a secret value for display in the UI.
 * Example:
 * sk_test_12345678 -> ••••••••5678
 */
export function maskSecret(value: string | null): string {
  if (!value) return "";

  if (value.length <= 4) {
    return MASKED_SENTINEL;
  }

  return `${MASKED_SENTINEL}${value.slice(-4)}`;
}