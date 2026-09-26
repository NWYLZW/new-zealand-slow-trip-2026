import { useEffect, useRef, useState } from "react";
import { usePrivateVault } from "../PrivateVaultContext";
import { LockIcon, UnlockIcon } from "./SketchIcons";
import { adventureLabel } from "./adventureLabels";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureUnlockView.css";

const errorLabels = {
  "passphrase-too-short": "vaultShort",
  "trusted-device-unavailable": "vaultDeviceError",
  "forget-unavailable": "vaultForgetError",
};

export function AdventureUnlockView({ active, language, onSuccess }) {
  const vault = usePrivateVault();
  const [passphrase, setPassphrase] = useState("");
  const activeRef = useRef(active);
  activeRef.current = active;
  const t = key => adventureLabel(key, language);

  useEffect(() => {
    if (!active) setPassphrase("");
  }, [active]);
  useEffect(() => () => { activeRef.current = false; }, []);

  const unlockWithDevice = async () => {
    if (vault.loading || !vault.isConfigured || vault.isUnlocked) return;
    setPassphrase("");
    if (await vault.unlockWithTrustedDevice() && activeRef.current) onSuccess?.();
  };

  const unlockWithPassphrase = async event => {
    event.preventDefault();
    if (vault.loading || !vault.isConfigured || vault.isUnlocked || !passphrase) return;
    const candidate = passphrase;
    setPassphrase("");
    if (await vault.unlockWithRecoveryPassphrase(candidate) && activeRef.current) onSuccess?.();
  };

  return <section className="trip-adventure-unlock" aria-label={t("unlock")}>
    {!vault.isConfigured && <p role="status"><PencilText>{t("vaultUnavailable")}</PencilText></p>}
    {vault.isConfigured && vault.isUnlocked && <div className="trip-adventure-unlock-status" role="status">
      <p><PencilText>{t("vaultUnlocked")}</PencilText></p>
      <PencilSurface as="button" variant="quiet" className="trip-adventure-unlock-action"
        onClick={() => vault.lock()}><LockIcon /><PencilText>{t("lockNow")}</PencilText></PencilSurface>
    </div>}
    {vault.isConfigured && !vault.isUnlocked && <>
      {vault.error && <p className="trip-adventure-unlock-error" role="alert">
        <PencilText>{t(errorLabels[vault.error] ?? "vaultError")}</PencilText>
      </p>}
      {vault.trusted && <div className="trip-adventure-unlock-device">
        <p><PencilText>{t("trustedDevice")}</PencilText></p>
        <PencilSurface as="button" variant="action" className="trip-adventure-unlock-action"
          disabled={vault.loading} onClick={unlockWithDevice}>
          <UnlockIcon /><PencilText>{t(vault.loading ? "unlocking" : "unlockDevice")}</PencilText>
        </PencilSurface>
      </div>}
      <form className="trip-adventure-unlock-recovery" onSubmit={unlockWithPassphrase}>
        <label htmlFor="trip-adventure-recovery"><PencilText>{t("recoveryPassphrase")}</PencilText></label>
        <input id="trip-adventure-recovery" type="password" autoComplete="current-password"
          value={passphrase} onChange={event => setPassphrase(event.target.value)}
          disabled={vault.loading} />
        <PencilSurface as="button" type="submit" variant="action" className="trip-adventure-unlock-action"
          disabled={vault.loading || !passphrase}>
          <UnlockIcon /><PencilText>{t(vault.loading ? "unlocking" : "unlockRecovery")}</PencilText>
        </PencilSurface>
      </form>
    </>}
  </section>;
}
