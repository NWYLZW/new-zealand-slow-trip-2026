import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { privateVaultPayload } from "./data/privateVaultPayload";
import { decryptPrivateVault, unlockPrivateVaultWithPassphrase } from "./privateVault/crypto";
import {
  forgetTrustedPrivateVaultDevice,
  hasTrustedPrivateVaultDevice,
  trustPrivateVaultOnThisDevice,
  unlockTrustedPrivateVaultDek,
} from "./privateVault/deviceTrust";

const PrivateVaultContext = createContext(null);
const manualLockStorageKey = "nz-trip-private-vault-manually-locked";
const isConfigured = Boolean(privateVaultPayload);

function setManualLock(locked) {
  try {
    if (locked) sessionStorage.setItem(manualLockStorageKey, "1");
    else sessionStorage.removeItem(manualLockStorageKey);
  } catch {
    // A missing session store only changes the convenience state, not secrecy.
  }
}

function isManuallyLocked() {
  try {
    return sessionStorage.getItem(manualLockStorageKey) === "1";
  } catch {
    return false;
  }
}

export function PrivateVaultProvider({ children }) {
  const [data, setData] = useState(null);
  const [trusted, setTrusted] = useState(false);
  const [loading, setLoading] = useState(isConfigured);
  const [error, setError] = useState("");

  const unlockWithTrustedDevice = useCallback(async () => {
    if (!isConfigured) return false;
    setLoading(true);
    setError("");
    try {
      const rawDek = await unlockTrustedPrivateVaultDek();
      setData(await decryptPrivateVault(privateVaultPayload, rawDek));
      setManualLock(false);
      return true;
    } catch {
      setTrusted(false);
      setError("trusted-device-unavailable");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!isConfigured) {
      setLoading(false);
      return () => { active = false; };
    }
    hasTrustedPrivateVaultDevice()
      .then((nextTrusted) => {
        if (!active) return;
        setTrusted(nextTrusted);
        if (nextTrusted && !isManuallyLocked()) unlockWithTrustedDevice();
        else setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [unlockWithTrustedDevice]);

  const unlockWithRecoveryPassphrase = useCallback(async (passphrase) => {
    if (!isConfigured) return false;
    setLoading(true);
    setError("");
    try {
      const { data: decrypted, rawDek } = await unlockPrivateVaultWithPassphrase(privateVaultPayload, passphrase);
      await trustPrivateVaultOnThisDevice(rawDek);
      setData(decrypted);
      setTrusted(true);
      setManualLock(false);
      return true;
    } catch (nextError) {
      setError(nextError?.message?.includes("at least 12") ? "passphrase-too-short" : "recovery-unavailable");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const lock = useCallback(() => {
    setData(null);
    setManualLock(true);
  }, []);

  const forgetDevice = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await forgetTrustedPrivateVaultDevice();
      setData(null);
      setTrusted(false);
      setManualLock(true);
      return true;
    } catch {
      setError("forget-unavailable");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    data,
    error,
    forgetDevice,
    isConfigured,
    isUnlocked: Boolean(data),
    loading,
    lock,
    trusted,
    unlockWithRecoveryPassphrase,
    unlockWithTrustedDevice,
  }), [data, error, forgetDevice, loading, lock, trusted, unlockWithRecoveryPassphrase, unlockWithTrustedDevice]);

  return <PrivateVaultContext.Provider value={value}>{children}</PrivateVaultContext.Provider>;
}

export function usePrivateVault() {
  const value = useContext(PrivateVaultContext);
  if (!value) throw new Error("usePrivateVault must be used inside PrivateVaultProvider.");
  return value;
}
