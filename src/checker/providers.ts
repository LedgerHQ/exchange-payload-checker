import {
  CURVES,
  parsePublicKeyHex,
  type CalEnv,
  type Curve,
  type ProviderConfig,
  type TransactionType,
} from "./logic";

export const CAL_PARTNERS_URL = "https://crypto-assets-service.api.ledger.com/v1/partners";

export const calPartnersUrl = (transactionType: TransactionType, calEnv: CalEnv) => {
  const params = new URLSearchParams({
    service_name: transactionType,
    env: calEnv,
    output: "partner_id,name,public_key,public_key_curve,service_app_version",
  });
  return `${CAL_PARTNERS_URL}?${params}`;
};

type Fetch = typeof fetch;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCurve = (value: unknown): value is Curve => CURVES.some(curve => curve === value);

async function getJson(fetchFn: Fetch, url: string, source: string): Promise<unknown> {
  const response = await fetchFn(url, { credentials: "omit", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(`${source} responded with HTTP ${response.status}`);
  return response.json();
}

function calPartnerConfig(entry: unknown): [string, ProviderConfig] | null {
  if (!isRecord(entry)) return null;
  const { partner_id: id, name, public_key: publicKey, public_key_curve: curve } = entry;
  const version = entry.service_app_version;
  if (typeof id !== "string" || !id || typeof publicKey !== "string" || !isCurve(curve)) {
    return null;
  }
  const key = parsePublicKeyHex(publicKey);
  if (!key.value) return null;
  return [
    id,
    {
      name: typeof name === "string" ? name : undefined,
      publicKey: { curve, data: key.value },
      version: typeof version === "number" ? version : undefined,
    },
  ];
}

export async function fetchCalPartners(
  transactionType: TransactionType,
  calEnv: CalEnv,
  fetchFn: Fetch = fetch,
): Promise<Record<string, ProviderConfig>> {
  const data = await getJson(fetchFn, calPartnersUrl(transactionType, calEnv), "CAL");
  if (!Array.isArray(data)) throw new Error("Unexpected CAL response");
  return Object.fromEntries(
    data.flatMap(entry => {
      const partner = calPartnerConfig(entry);
      return partner ? [partner] : [];
    }),
  );
}
