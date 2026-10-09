import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_SWAP_PAYLOAD,
  LEGACY_SWAP_SIGNATURE,
  OTHER_PUBLIC_KEY_HEX,
  PUBLIC_KEY_HEX,
  SELL_PAYLOAD,
  SELL_SIGNATURE,
} from "../test/fixtures";
import { ExchangePayloadChecker } from ".";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

const calPartner = (partnerId: string, name: string, publicKey = PUBLIC_KEY_HEX) => ({
  partner_id: partnerId,
  name,
  public_key: publicKey,
  public_key_curve: "secp256k1",
  service_app_version: 2,
});

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async input => {
    const url = new URL(String(input));
    const service = url.searchParams.get("service_name");
    const env = url.searchParams.get("env");
    if (service === "swap" && env === "prod") {
      return jsonResponse([
        calPartner("changelly_v2", "Changelly"),
        calPartner("lifi", "LI.FI"),
        calPartner("swapkit_hyperliquid", "SwapKit"),
      ]);
    }
    if (service === "sell" && env === "test") {
      return jsonResponse([calPartner("ledgersell", "LedgerSell", OTHER_PUBLIC_KEY_HEX)]);
    }
    return jsonResponse([]);
  });
  vi.stubGlobal("fetch", fetchMock);
});

const setup = () => {
  const user = userEvent.setup();
  render(<ExchangePayloadChecker />);
  return user;
};

const resultSection = () => within(screen.getByRole("heading", { name: "Result" }).parentElement!);

async function paste(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  const input = screen.getByLabelText(label);
  await user.click(input);
  await user.paste(value);
}

describe("ExchangePayloadChecker", () => {
  it("validates a Sell NG payload with a custom key", async () => {
    const user = setup();

    await user.click(screen.getByRole("radio", { name: "Sell" }));
    await paste(user, /^Payload/, SELL_PAYLOAD);
    await paste(user, /^Signature/, SELL_SIGNATURE);
    await user.click(screen.getByRole("radio", { name: "Custom key" }));
    await paste(user, /^Public key/, PUBLIC_KEY_HEX);

    expect(await resultSection().findByText("Valid")).toBeInTheDocument();
    expect(resultSection().getByText("Decoded fields")).toBeInTheDocument();
    expect(resultSection().getByText("in_currency")).toBeInTheDocument();
  });

  it("reports an invalid signature for another key", async () => {
    const user = setup();

    await user.click(screen.getByRole("radio", { name: "Sell" }));
    await paste(user, /^Payload/, SELL_PAYLOAD);
    await paste(user, /^Signature/, SELL_SIGNATURE);
    await user.click(screen.getByRole("radio", { name: "Custom key" }));
    await paste(user, /^Public key/, OTHER_PUBLIC_KEY_HEX);

    expect(await resultSection().findByText("Invalid")).toBeInTheDocument();
    expect(resultSection().getByText("SIGNATURE_INVALID")).toBeInTheDocument();
  });

  it("detects a legacy Swap payload in Auto with a custom key", async () => {
    const user = setup();

    await paste(user, /^Payload/, LEGACY_SWAP_PAYLOAD);
    await paste(user, /^Signature/, LEGACY_SWAP_SIGNATURE);
    await user.click(screen.getByRole("radio", { name: "Custom key" }));
    await paste(user, /^Public key/, PUBLIC_KEY_HEX);

    expect(screen.getByText("Detected format: Legacy (hex).")).toBeInTheDocument();
    expect(await resultSection().findByText("Valid")).toBeInTheDocument();
  });

  it("suggests switching to Sell for a Sell payload checked as a Swap", async () => {
    const user = setup();

    await paste(user, /^Payload/, SELL_PAYLOAD);
    await paste(user, /^Signature/, SELL_SIGNATURE);
    await user.click(screen.getByRole("radio", { name: "Custom key" }));
    await paste(user, /^Public key/, PUBLIC_KEY_HEX);

    await user.click(await resultSection().findByRole("button", { name: "Switch to Sell" }));

    expect(screen.getByRole("radio", { name: "Sell" })).toBeChecked();
    expect(await resultSection().findByText("Valid")).toBeInTheDocument();
  });

  it("lists every CAL swap partner with a key", async () => {
    const user = setup();

    const trigger = screen.getByRole("combobox", { name: /Provider/ });
    await waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);

    const options = (await screen.findAllByRole("option")).map(option => option.textContent);
    expect(options).toEqual([
      "Changelly (changelly_v2)",
      "LI.FI (lifi)",
      "SwapKit (swapkit_hyperliquid)",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("service_name=swap&env=prod"),
      expect.objectContaining({ credentials: "omit" }),
    );
  });

  it("uses the Test CAL environment for Sell providers", async () => {
    const user = setup();

    await user.click(screen.getByRole("radio", { name: "Sell" }));
    await user.click(screen.getByRole("radio", { name: "Test" }));
    await paste(user, /^Payload/, SELL_PAYLOAD);
    await paste(user, /^Signature/, SELL_SIGNATURE);

    const trigger = screen.getByRole("combobox", { name: /Provider/ });
    await waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "LedgerSell (ledgersell)" }));

    expect(await resultSection().findByText("SIGNATURE_INVALID")).toBeInTheDocument();
  });

  it("offers a retry when the providers cannot be loaded", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const user = setup();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load providers: offline");
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByRole("combobox", { name: /Provider/ })).toBeEnabled());
  });
});
