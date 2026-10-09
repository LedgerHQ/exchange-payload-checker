// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { calPartnersUrl, fetchCalPartners } from "./providers";

const KEY_HEX = `04${"11".repeat(64)}`;
const KEY_BYTES = Uint8Array.from({ length: 65 }, (_, index) => (index === 0 ? 0x04 : 0x11));

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const fetchReturning = (routes: Record<string, unknown>) =>
  vi.fn<typeof fetch>(async input => {
    const url = String(input);
    const route = Object.keys(routes).find(prefix => url.startsWith(prefix));
    return route ? jsonResponse(routes[route]) : jsonResponse({}, 404);
  });

const calPartner = (partnerId: string, overrides: Record<string, unknown> = {}) => ({
  partner_id: partnerId,
  name: partnerId.toUpperCase(),
  public_key: KEY_HEX,
  public_key_curve: "secp256k1",
  service_app_version: 2,
  ...overrides,
});

describe("calPartnersUrl", () => {
  it("queries the partners of a service in a CAL environment", () => {
    const url = new URL(calPartnersUrl("sell", "test"));
    expect(url.origin + url.pathname).toBe(
      "https://crypto-assets-service.api.ledger.com/v1/partners",
    );
    expect(url.searchParams.get("service_name")).toBe("sell");
    expect(url.searchParams.get("env")).toBe("test");
    expect(url.searchParams.get("output")).toContain("public_key_curve");
  });
});

describe("fetchCalPartners", () => {
  it("maps CAL partners by partner id and skips unusable entries", async () => {
    const fetchFn = fetchReturning({
      [calPartnersUrl("sell", "prod")]: [
        calPartner("coinify", { public_key_curve: "secp256r1", service_app_version: 1 }),
        calPartner("nokey", { public_key: undefined }),
        calPartner("badcurve", { public_key_curve: "ed25519" }),
        calPartner("badhex", { public_key: "zz" }),
        { name: "No id", public_key: KEY_HEX, public_key_curve: "secp256k1" },
        null,
      ],
    });

    await expect(fetchCalPartners("sell", "prod", fetchFn)).resolves.toEqual({
      coinify: {
        name: "COINIFY",
        publicKey: { curve: "secp256r1", data: KEY_BYTES },
        version: 1,
      },
    });
    expect(fetchFn).toHaveBeenCalledWith(calPartnersUrl("sell", "prod"), {
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  });

  it("fails on an HTTP error or an unexpected body", async () => {
    await expect(fetchCalPartners("sell", "prod", fetchReturning({}))).rejects.toThrow(
      "CAL responded with HTTP 404",
    );
    const objectBody = fetchReturning({ [calPartnersUrl("sell", "prod")]: { error: "nope" } });
    await expect(fetchCalPartners("sell", "prod", objectBody)).rejects.toThrow(
      "Unexpected CAL response",
    );
  });
});

describe("fetchCalPartners for Swap", () => {
  it("lists every CAL partner with a key, with the CAL name, from CAL only", async () => {
    const fetchFn = fetchReturning({
      [calPartnersUrl("swap", "prod")]: [calPartner("changelly_v2"), calPartner("lifi")],
    });

    const configs = await fetchCalPartners("swap", "prod", fetchFn);

    expect(Object.keys(configs)).toEqual(["changelly_v2", "lifi"]);
    expect(configs.lifi).toMatchObject({ name: "LIFI" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
