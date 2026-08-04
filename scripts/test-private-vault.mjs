import assert from "node:assert/strict";
import {
  createPrivateVaultPayload,
  unlockPrivateVaultWithPassphrase,
} from "../src/privateVault/crypto.js";

const source = {
  title: "Private vault test fixture",
  entries: [{ date: "2026-10-06", note: "No personal data in this test fixture." }],
};
const passphrase = "vault test passphrase, not a real secret";
const payload = await createPrivateVaultPayload(source, passphrase);
const unlocked = await unlockPrivateVaultWithPassphrase(payload, passphrase);

assert.deepEqual(unlocked.data, source);
await assert.rejects(() => unlockPrivateVaultWithPassphrase(payload, "wrong recovery passphrase"));
assert.equal(payload.cipher.ciphertext.includes("No personal data"), false);
const tamperedPayload = structuredClone(payload);
tamperedPayload.cipher.ciphertext = `${tamperedPayload.cipher.ciphertext.slice(0, -2)}AA`;
await assert.rejects(() => unlockPrivateVaultWithPassphrase(tamperedPayload, passphrase));
console.log("Private vault round-trip, wrong-passphrase and tamper checks passed.");
