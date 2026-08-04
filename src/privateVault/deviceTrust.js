import { base64ToBytes, bytesToBase64 } from "./crypto";

const databaseName = "nz-slow-trip-private-vault";
const storeName = "trusted-device";
const deviceRecordKey = "device-v1";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("This browser does not support device trust storage."));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onerror = () => reject(request.error ?? new Error("Could not open device trust storage."));
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore(mode, callback) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = callback(transaction.objectStore(storeName));
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not update device trust storage."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Device trust storage was aborted."));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not read device trust storage."));
    });
  } finally {
    database.close();
  }
}

async function readDeviceRecord() {
  return withStore("readonly", (store) => store.get(deviceRecordKey));
}

export async function hasTrustedPrivateVaultDevice() {
  const record = await readDeviceRecord();
  return Boolean(record?.privateKey && record?.wrappedDek);
}

export async function trustPrivateVaultOnThisDevice(rawDek) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    false,
    ["encrypt", "decrypt"],
  );
  const wrappedDek = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, keyPair.publicKey, rawDek);
  const record = {
    version: 1,
    createdAt: new Date().toISOString(),
    privateKey: keyPair.privateKey,
    wrappedDek: bytesToBase64(wrappedDek),
  };
  await withStore("readwrite", (store) => store.put(record, deviceRecordKey));
  return record.createdAt;
}

export async function unlockTrustedPrivateVaultDek() {
  const record = await readDeviceRecord();
  if (!record?.privateKey || !record?.wrappedDek) {
    throw new Error("This browser has not been trusted for the private vault.");
  }
  const rawDek = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    record.privateKey,
    base64ToBytes(record.wrappedDek),
  );
  return new Uint8Array(rawDek);
}

export async function forgetTrustedPrivateVaultDevice() {
  await withStore("readwrite", (store) => store.delete(deviceRecordKey));
}
