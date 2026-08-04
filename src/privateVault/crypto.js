import { argon2id } from "hash-wasm";

export const PRIVATE_VAULT_FORMAT = "nz-slow-trip-private-vault";
export const PRIVATE_VAULT_VERSION = 1;
export const PRIVATE_VAULT_AAD = `${PRIVATE_VAULT_FORMAT}/v${PRIVATE_VAULT_VERSION}`;

export const privateVaultKdf = {
  algorithm: "Argon2id",
  memorySize: 19456,
  iterations: 2,
  parallelism: 1,
  hashLength: 32,
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToBase64(bytes) {
  let binary = "";
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let index = 0; index < input.length; index += 0x8000) {
    binary += String.fromCharCode(...input.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(value) {
  if (typeof value !== "string" || value.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error("Private vault contains malformed binary data.");
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function normalizePassphrase(passphrase) {
  if (typeof passphrase !== "string" || passphrase.normalize("NFKC").length < 12) {
    throw new Error("Use a recovery passphrase of at least 12 characters.");
  }
  return passphrase.normalize("NFKC");
}

function assertPayload(payload) {
  if (
    !payload
    || payload.format !== PRIVATE_VAULT_FORMAT
    || payload.version !== PRIVATE_VAULT_VERSION
    || payload.kdf?.algorithm !== privateVaultKdf.algorithm
    || payload.kdf?.memorySize !== privateVaultKdf.memorySize
    || payload.kdf?.iterations !== privateVaultKdf.iterations
    || payload.kdf?.parallelism !== privateVaultKdf.parallelism
    || payload.kdf?.hashLength !== privateVaultKdf.hashLength
    || payload.cipher?.algorithm !== "AES-256-GCM"
    || payload.wrappedDek?.algorithm !== "AES-256-GCM"
  ) {
    throw new Error("This private vault is not a supported format.");
  }
}

async function deriveKek(passphrase, salt, parameters) {
  const normalized = normalizePassphrase(passphrase);
  const rawKey = await argon2id({
    password: normalized,
    salt,
    parallelism: parameters.parallelism,
    iterations: parameters.iterations,
    memorySize: parameters.memorySize,
    hashLength: parameters.hashLength,
    outputType: "binary",
  });
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptBytes(key, plaintext) {
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(PRIVATE_VAULT_AAD), tagLength: 128 },
    key,
    plaintext,
  );
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) };
}

async function decryptBytes(key, encrypted) {
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(encrypted.iv),
      additionalData: encoder.encode(PRIVATE_VAULT_AAD),
      tagLength: 128,
    },
    key,
    base64ToBytes(encrypted.ciphertext),
  );
}

export async function createPrivateVaultPayload(data, passphrase) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Private vault source must be a JSON object.");
  }
  const salt = randomBytes(16);
  const kek = await deriveKek(passphrase, salt, privateVaultKdf);
  const dek = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const rawDek = await crypto.subtle.exportKey("raw", dek);
  const cipher = await encryptBytes(dek, encoder.encode(JSON.stringify(data)));
  const wrappedDek = await encryptBytes(kek, rawDek);

  return {
    format: PRIVATE_VAULT_FORMAT,
    version: PRIVATE_VAULT_VERSION,
    createdAt: new Date().toISOString(),
    kdf: { ...privateVaultKdf, salt: bytesToBase64(salt) },
    cipher: { algorithm: "AES-256-GCM", ...cipher },
    wrappedDek: { algorithm: "AES-256-GCM", ...wrappedDek },
  };
}

export async function unwrapPrivateVaultDek(payload, passphrase) {
  assertPayload(payload);
  const salt = base64ToBytes(payload.kdf.salt);
  const kek = await deriveKek(passphrase, salt, payload.kdf);
  const rawDek = await decryptBytes(kek, payload.wrappedDek);
  return new Uint8Array(rawDek);
}

export async function decryptPrivateVault(payload, rawDek) {
  assertPayload(payload);
  const dek = await crypto.subtle.importKey("raw", rawDek, { name: "AES-GCM" }, false, ["decrypt"]);
  const plainBytes = await decryptBytes(dek, payload.cipher);
  let result;
  try {
    result = JSON.parse(decoder.decode(plainBytes));
  } catch {
    throw new Error("The private vault did not contain valid JSON.");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("The private vault must contain a JSON object.");
  }
  return result;
}

export async function unlockPrivateVaultWithPassphrase(payload, passphrase) {
  const rawDek = await unwrapPrivateVaultDek(payload, passphrase);
  const data = await decryptPrivateVault(payload, rawDek);
  return { data, rawDek };
}
