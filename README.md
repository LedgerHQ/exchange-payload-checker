# Exchange Payload Checker

A web page for Ledger exchange partners (CEX swap and sell providers). Paste a payload, its signature and your public key to see, without a Ledger device, whether Ledger Live and the Exchange device app would accept them.

It replaces the Exchange Payload Checker page of the `web-tools` app in the [ledger-live](https://github.com/LedgerHQ/ledger-live) monorepo.

## What it checks

- **Swap NG**: base64url `NewTransactionResponse`, signature over `"." + payload`.
- **Swap legacy**: hex `NewTransactionResponse`, signature over the raw protobuf bytes.
- **Sell NG**: base64url `NewSellResponse`, signature over `"." + payload`.

For each payload it checks the encoding, the protobuf fields, the size limits, the nonce, the signature against the partner public key and, if you enter them, the values you expect (currencies, amounts, addresses, nonce). It shows the decoded fields and explains each issue found.

In Auto mode, the swap format comes from the CAL version of the selected provider, or from the payload itself when you use a custom key. If the payload looks like another transaction type or format, the page suggests switching.

Out of scope: DEX swaps (no signed partner payload), Buy, Fund and legacy Sell (CAL version 1). The device still checks the fees, address ownership and coin app, which this page cannot check.

## Privacy

Everything runs in your browser. The payload, signature and public key are never sent anywhere, logged, stored or put in the URL. The page only fetches the public partner keys from the Ledger CAL API: `https://crypto-assets-service.api.ledger.com/v1/partners?service_name=<swap|sell>&env=<prod|test>`.

The provider list comes from CAL: it shows every partner with a key for the selected service and environment. Choose the CAL environment for both Swap and Sell: Production, or Test for partners still in integration. To check a key that is not in CAL yet, use Custom key.

## Run locally

Requires Node 24 (see `.nvmrc`) and pnpm 10.

```sh
pnpm install
pnpm dev        # http://localhost:5173/exchange-payload-checker/
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build      # outputs dist/
pnpm preview
```

## Deployment

`.github/workflows/deploy.yml` builds the site and deploys `dist/` to GitHub Pages on every push to `main`. Vite uses `base: "/exchange-payload-checker/"` to match the Pages URL, also for `pnpm dev` and `pnpm preview`. `.github/workflows/ci.yml` runs lint, format check, typecheck, tests and build on pull requests and on `main`.

## Related projects

- [`@ledgerhq/hw-app-exchange`](https://www.npmjs.com/package/@ledgerhq/hw-app-exchange) provides the checks (`checkSwapPayload`, `checkSellPayload`, `swapPayloadFormatOf`). They mirror what Ledger Live and the Exchange app do, so this page follows them when the package is updated.
- [LedgerHQ/exchange-tool](https://github.com/LedgerHQ/exchange-tool) is a Go CLI to generate, sign, check and read swap and sell payloads. Use it to create test payloads. This page is for checking a payload from your backend before it reaches Ledger Live.

## Checker package version

The version of `@ledgerhq/hw-app-exchange` with the checker is not published on npm yet ([LedgerHQ/ledger-live#23117](https://github.com/LedgerHQ/ledger-live/pull/23117)). Until it is, the package is built from that PR and committed in `.local-deps/`:

```json
"@ledgerhq/hw-app-exchange": "file:.local-deps/ledgerhq-hw-app-exchange-0.28.0.tgz",
```

To rebuild the tarball from a ledger-live checkout that has the change:

```sh
pnpm --filter @ledgerhq/hw-app-exchange build
cd libs/ledgerjs/packages/hw-app-exchange
pnpm pack --pack-destination <this repo>/.local-deps
```

Once the PR is released, switch to the published version, run `pnpm install` and delete `.local-deps/`:

```json
"@ledgerhq/hw-app-exchange": "<published version>",
```

## License

[Apache-2.0](./LICENSE)
