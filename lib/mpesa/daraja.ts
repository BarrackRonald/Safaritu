// lib/mpesa/daraja.ts
// Compatibility shim — re-exports from the current Mpesa implementation.
// Old files imported from @/lib/mpesa/daraja — this keeps them working.
export {
  getMpesaAccessToken,
  initiateStkPush,
  queryStkStatus,
} from "@/lib/payments/mpesa";

// Types that old files expected
export type DarajaConfig = {
  consumerKey:    string;
  consumerSecret: string;
  shortcode:      string;
  passkey:        string;
  environment:    "sandbox" | "production";
};

// Old function name aliases
export const getDarajaToken  = getMpesaAccessToken;
export const initiateSTKPush = initiateStkPush;

export function normalisePhone(phone: string): string {
  let p = phone.replace(/[\s\-]/g, "");
  if (p.startsWith("07") || p.startsWith("01")) p = "254" + p.slice(1);
  if (p.startsWith("+")) p = p.slice(1);
  return p;
}

export type STKCallbackBody = {
  Body: {
    stkCallback: {
      MerchantRequestID:  string;
      CheckoutRequestID:  string;
      ResultCode:         number;
      ResultDesc:         string;
      CallbackMetadata?: {
        Item: { Name: string; Value: string | number }[];
      };
    };
  };
};

export function parseSTKCallback(body: STKCallbackBody) {
  const cb   = body.Body.stkCallback;
  const items = cb.CallbackMetadata?.Item ?? [];
  const get   = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    resultCode:          cb.ResultCode,
    resultDesc:          cb.ResultDesc,
    checkoutRequestId:   cb.CheckoutRequestID,
    merchantRequestId:   cb.MerchantRequestID,
    mpesaReceiptNumber:  get("MpesaReceiptNumber") as string | undefined,
    amount:              Number(get("Amount") ?? 0),
    phoneNumber:         get("PhoneNumber") as string | undefined,
    transactionDate:     get("TransactionDate") as string | undefined,
  };
}