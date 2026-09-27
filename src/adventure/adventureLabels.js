// Keep public labels separate from itinerary facts. Missing English facts fall back to
// the source value; they are never translated or inferred at runtime.
const labels = {
  menu: ["菜单", "Menu"],
  menuTitle: ["旅行菜单", "Trip menu"],
  closeMenu: ["关闭菜单", "Close menu"],
  backToMenu: ["返回菜单", "Back to menu"],
  settings: ["设置", "Settings"],
  language: ["语言", "Language"],
  theme: ["主题色", "Theme color"],
  appearance: ["外观", "Appearance"],
  orientation: ["屏幕方向", "Screen orientation"],
  portrait: ["锁定竖屏", "Portrait"],
  landscape: ["锁定横屏", "Landscape"],
  orientationApplying: ["正在应用方向设置…", "Applying orientation preference…"],
  orientationPortraitLocked: ["已锁定为竖屏", "Portrait orientation is locked"],
  orientationLandscapeLocked: ["已锁定为横屏", "Landscape orientation is locked"],
  orientationSystem: ["跟随设备的系统方向", "Following the device orientation"],
  orientationUnsupported: ["当前浏览器不支持网页锁定方向，将跟随系统。", "This browser cannot lock page orientation, so the app follows the system."],
  orientationRestricted: ["当前浏览器模式不允许锁定方向，将跟随系统。安装应用或进入浏览器全屏后可能可用。", "This browser mode does not allow orientation locking, so the app follows the system. It may work when installed or in browser fullscreen."],
  light: ["浅色", "Light"],
  dark: ["深色", "Dark"],
  system: ["跟随系统", "System"],
  chinese: ["中文", "Chinese"],
  english: ["English", "English"],
  lake: ["湖蓝", "Lake blue"],
  fern: ["蕨绿", "Fern green"],
  sunset: ["暖霞", "Warm sunset"],
  unlock: ["解锁私密资料", "Unlock private details"],
  lockPrivate: ["锁定私密资料", "Lock private details"],
  vaultUnavailable: ["当前没有可解锁的私密资料。", "No encrypted private details are available yet."],
  vaultUnlocked: ["私密资料已解锁，将在原有行程位置显示。", "Private details are unlocked in their original trip context."],
  trustedDevice: ["本设备已保存解锁密钥。", "This device has a stored unlock key."],
  recoveryPassphrase: ["恢复口令", "Recovery passphrase"],
  unlocking: ["正在解锁…", "Unlocking…"],
  unlockDevice: ["用本设备解锁", "Unlock with this device"],
  unlockRecovery: ["解锁并信任本设备", "Unlock and trust this device"],
  lockNow: ["立即锁定", "Lock now"],
  vaultError: ["无法解锁保险箱，请检查恢复口令。", "Unable to unlock the vault. Check the recovery passphrase."],
  vaultShort: ["请输入创建保险箱时使用的恢复口令。", "Enter the recovery passphrase used to create this vault."],
  vaultDeviceError: ["本设备保存的密钥无法解锁，请改用恢复口令。", "The stored device key cannot unlock this vault. Use the recovery passphrase."],
  vaultForgetError: ["无法移除此设备保存的密钥。", "Could not remove this device’s stored key."],
  install: ["安装到设备", "Install on device"],
  installed: ["已安装到设备", "Installed on this device"],
  installing: ["正在请求安装…", "Requesting installation…"],
  installHelp: ["安装说明", "Install instructions"],
  iosHelp: ["请在 Safari 中点按“分享”，再选择“添加到主屏幕”。", "In Safari, tap Share, then choose Add to Home Screen."],
  browserHelp: ["请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。", "Open the browser menu and choose Install app or Add to Home screen."],
  installDismissed: ["安装提示已关闭，可从浏览器菜单安装。", "The install prompt was dismissed. You can install from the browser menu."],
  appUpdate: ["应用更新", "App update"],
  checkUpdate: ["检查更新", "Check for updates"],
  checkingUpdate: ["正在检查更新…", "Checking for updates…"],
  updateAvailable: ["更新并刷新", "Update and refresh"],
  updatingApp: ["正在更新…", "Updating…"],
  appCurrent: ["已是最新版本", "App is up to date"],
  updateOffline: ["当前离线，联网后再检查。", "You are offline. Check again when connected."],
  updateFailed: ["更新失败，请重试。", "Update failed. Please try again."],
  updateUnchecked: ["尚未检查更新", "Updates have not been checked"],
  updateStatusAvailable: ["有新版本", "Update available"],
  updateStatusAvailableFull: ["有新版本，点击可更新并刷新", "An update is available; activate to update and refresh"],
  updateStatusCurrent: ["已是最新", "Up to date"],
  updateStatusChecking: ["检查中", "Checking"],
  updateStatusUpdating: ["更新中", "Updating"],
  updateStatusOffline: ["离线", "Offline"],
  updateStatusError: ["检查失败", "Check failed"],
  updateStatusUnchecked: ["未检查", "Not checked"],
  oldVersion: ["老版本", "Old version"],
  openOldVersion: ["打开老版本行程", "Open the old itinerary"],
  tasks: ["任务", "Tasks"],
  bag: ["背包", "Backpack"],
  photos: ["相册", "Photos"],
  camera: ["相机", "Camera"],
  map: ["冒险地图", "Adventure map"],
  close: ["关闭", "Close"],
  back: ["返回", "Back"],
};

export function adventureText(zh, en, language = "zh") {
  return language === "en" && typeof en === "string" && en.trim() ? en : zh ?? "";
}

export function adventureField(record, key, language = "zh") {
  if (!record) return "";
  const original = record[key];
  const english = record[`${key}En`];
  return language === "en" && english !== null && english !== undefined
    && (typeof english !== "string" || english.trim()) ? english : original ?? "";
}

export function adventureLabel(key, language = "zh") {
  const pair = labels[key];
  return pair ? adventureText(pair[0], pair[1], language) : key;
}
