export type DarajaConfig = {
  consumerKey?: string;
  consumerSecret?: string;
  shortcode?: string;
  passkey?: string;
};

export async function getDarajaToken() {
  return "";
}

export async function initiateSTKPush() {
  return {};
}

export function normalisePhone(phone: string) {
  return phone;
}

export type STKCallbackBody = any;

export function parseSTKCallback(payload: any) {
  return payload;
}