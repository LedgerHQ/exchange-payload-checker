import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";

const PRIVATE_KEY = new Uint8Array(32).fill(7);
const OTHER_PRIVATE_KEY = new Uint8Array(32).fill(9);

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
const toBase64Url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const ascii = (value: string) => Array.from(value, char => char.charCodeAt(0));

const field = (fieldNumber: number, bytes: number[]) => [
  (fieldNumber << 3) | 2,
  bytes.length,
  ...bytes,
];
const stringField = (fieldNumber: number, value: string) => field(fieldNumber, ascii(value));

const sign = (message: Uint8Array, privateKey = PRIVATE_KEY) =>
  secp256k1.sign(sha256(message), privateKey, { prehash: false }).toCompactRawBytes();

export const PUBLIC_KEY_HEX = toHex(secp256k1.getPublicKey(PRIVATE_KEY, false));
export const OTHER_PUBLIC_KEY_HEX = toHex(secp256k1.getPublicKey(OTHER_PRIVATE_KEY, false));

const SELL_NONCE = Array.from({ length: 32 }, () => 0xab);

// NewSellResponse, with out_amount (6) as a UDecimal with coefficient 1.
export const SELL_PAYLOAD = toBase64Url(
  Uint8Array.from([
    ...stringField(1, "trader@example.com"),
    ...stringField(2, "ETH"),
    ...field(3, [0x01]),
    ...stringField(4, "0xabc"),
    ...stringField(5, "EUR"),
    ...field(6, field(1, [0x01])),
    ...field(7, SELL_NONCE),
  ]),
);
export const SELL_SIGNATURE = toBase64Url(sign(Uint8Array.from(ascii(`.${SELL_PAYLOAD}`))));

const LEGACY_SWAP_BYTES = Uint8Array.from([
  ...stringField(1, "bc1qpayin"),
  ...stringField(3, "0xrefund"),
  ...stringField(5, "0xpayout"),
  ...stringField(7, "BTC"),
  ...stringField(8, "ETH"),
  ...field(9, [0x01]),
  ...field(10, [0x02]),
  ...stringField(11, "OtXpAvlovk"),
]);
export const LEGACY_SWAP_PAYLOAD = toHex(LEGACY_SWAP_BYTES);
export const LEGACY_SWAP_SIGNATURE = toHex(sign(LEGACY_SWAP_BYTES));
