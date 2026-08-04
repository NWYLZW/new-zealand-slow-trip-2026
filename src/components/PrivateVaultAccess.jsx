import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ShieldIcon from "@mui/icons-material/Shield";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useLanguage } from "../LanguageContext";
import { usePrivateVault } from "../PrivateVaultContext";
import "./PrivateVaultAccess.css";

function errorText(error, isEnglish) {
  if (error === "passphrase-too-short") return isEnglish ? "Enter the recovery passphrase used when this vault was created." : "请输入创建保险箱时使用的恢复口令。";
  if (error === "trusted-device-unavailable") return isEnglish ? "The stored device key cannot unlock the current vault. Use the recovery passphrase once to trust this device again." : "保存的设备密钥无法解锁当前保险箱。请用恢复口令解锁一次并重新信任此设备。";
  if (error === "forget-unavailable") return isEnglish ? "Could not remove this device’s stored key." : "无法移除此设备保存的密钥。";
  return isEnglish ? "Unable to unlock this vault. Check the recovery passphrase." : "无法解锁保险箱，请检查恢复口令。";
}

export function PrivateVaultDialog({ onClose, open }) {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const vault = usePrivateVault();
  const [passphrase, setPassphrase] = useState("");
  const close = () => {
    setPassphrase("");
    onClose?.();
  };

  const unlockWithPassphrase = async () => {
    const unlocked = await vault.unlockWithRecoveryPassphrase(passphrase);
    if (unlocked) close();
  };

  const unlockWithDevice = async () => {
    const unlocked = await vault.unlockWithTrustedDevice();
    if (unlocked) close();
  };

  return (
    <Dialog className="private-vault-dialog" fullWidth maxWidth="sm" onClose={close} open={open}>
        <DialogTitle>{isEnglish ? "Private details" : "私密资料"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25}>
            <Stack direction="row" alignItems="flex-start" spacing={1.25} className="private-vault-dialog-intro">
              <Box><ShieldIcon /></Box>
              <Box>
                <Typography fontWeight={900}>{isEnglish ? "Decrypt locally in this browser" : "只在此浏览器本地解密"}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {isEnglish ? "Unlocked fields appear inside the related hotel, flight, car-rental and activity details. GitHub stores ciphertext only." : "解锁后，私密字段会直接显示在对应的酒店、航班、租车和活动详情中；GitHub 只保存密文。"}
                </Typography>
              </Box>
            </Stack>

            {!vault.isConfigured && (
              <Alert severity="info">
                {isEnglish ? "No encrypted private-vault payload has been added yet." : "当前还没有上传私密保险箱密文。"}
              </Alert>
            )}

            {vault.error && <Alert severity="error">{errorText(vault.error, isEnglish)}</Alert>}

            {vault.isConfigured && !vault.isUnlocked && !vault.trusted && (
              <TextField
                autoComplete="current-password"
                label={isEnglish ? "Recovery passphrase" : "恢复口令"}
                onChange={(event) => setPassphrase(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") unlockWithPassphrase();
                }}
                type="password"
                value={passphrase}
                fullWidth
              />
            )}

            {vault.isUnlocked && (
              <Alert severity="success">
                {isEnglish ? "Private fields are now visible in their original trip context on this device." : "私密字段现在已在本设备的原有行程上下文中显示。"}
              </Alert>
            )}
            {vault.trusted && !vault.isUnlocked && vault.isConfigured && (
              <Typography color="text.secondary" variant="body2">
                {isEnglish ? "This browser has a non-exportable local device key. No key file is needed." : "此浏览器保存了不可导出的本地设备密钥，无需再次选择密钥文件。"}
              </Typography>
            )}
            {vault.trusted && <Divider />}
            {vault.trusted && (
              <Typography color="text.secondary" variant="caption">
                {isEnglish ? "Shared device? Lock now, or remove this device’s key entirely." : "如为共享设备，请立即锁定，或彻底移除此设备的密钥。"}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {vault.isUnlocked && <Button onClick={vault.lock} startIcon={<LockIcon />}>{isEnglish ? "Lock now" : "立即锁定"}</Button>}
          {vault.trusted && <Button color="inherit" onClick={vault.forgetDevice} startIcon={<DeleteOutlineIcon />}>{isEnglish ? "Forget this device" : "移除此设备"}</Button>}
          {vault.isConfigured && !vault.isUnlocked && (
            <Button
              disabled={vault.loading || (!vault.trusted && passphrase.length === 0)}
              onClick={vault.trusted ? unlockWithDevice : unlockWithPassphrase}
              startIcon={<LockOpenIcon />}
              variant="contained"
            >
              {vault.loading ? (isEnglish ? "Unlocking…" : "正在解锁…") : (vault.trusted ? (isEnglish ? "Unlock with this device" : "用本设备解锁") : (isEnglish ? "Unlock and trust this device" : "解锁并信任此设备"))}
            </Button>
          )}
        </DialogActions>
    </Dialog>
  );
}

function privateValue(value) {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function PrivateDetailSection({ itemId, section, title }) {
  const { data, isUnlocked } = usePrivateVault();
  const item = isUnlocked ? data?.[section]?.[itemId] : null;
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  return (
    <Box className="private-detail-section">
      <Stack alignItems="center" direction="row" spacing={0.75}>
        <LockOpenIcon fontSize="small" />
        <Typography fontWeight={900} variant="body2">{title}</Typography>
      </Stack>
      <Box component="dl">
        {Object.entries(item).map(([label, value]) => (
          <Box key={label}>
            <Typography component="dt" variant="caption">{label}</Typography>
            <Typography component="dd" variant="body2">{privateValue(value)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
