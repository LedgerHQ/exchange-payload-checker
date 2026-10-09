import { Buffer } from "buffer";

// @ledgerhq/hw-app-exchange uses Node's Buffer.
globalThis.Buffer ??= Buffer;
