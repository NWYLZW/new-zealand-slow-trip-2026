import { assetPath } from "./assets";

export const itineraryPath = assetPath("v1");
export const adventurePath = assetPath("");
const adventureAliases = new Set([
  adventurePath, adventurePath.slice(0, -1), assetPath("index.html"),
  assetPath("adventure"), assetPath("adventure/"), assetPath("adventure/index.html"), assetPath("adventure.html"),
]);
const itineraryAliases = new Set([itineraryPath, itineraryPath + "/", itineraryPath + "/index.html", itineraryPath + ".html"]);

export function isAdventurePath(path = location.pathname) {
  return adventureAliases.has(path);
}

export function isItineraryPath(path = location.pathname) {
  return itineraryAliases.has(path);
}

export function normalizeSiteUrl() {
  const url = new URL(location.href);
  const canonicalPath = isAdventurePath(url.pathname) ? adventurePath
    : isItineraryPath(url.pathname) ? itineraryPath : url.pathname;
  if (url.pathname !== canonicalPath) {
    url.pathname = canonicalPath;
    history.replaceState(history.state, "", url);
  }
}

export function navigateSite(href) {
  const url = new URL(href, location.href);
  if (url.origin !== location.origin || (!isAdventurePath(url.pathname) && !isItineraryPath(url.pathname))) {
    location.assign(url.href);
    return;
  }
  if (url.href !== location.href) history.pushState(null, "", url);
  normalizeSiteUrl();
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
}

export function followSiteLink(event) {
  const link = event.currentTarget;
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
    || event.shiftKey || event.altKey || link.hasAttribute("download")
    || (link.target && link.target !== "_self")) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || (!isAdventurePath(url.pathname) && !isItineraryPath(url.pathname))) return;
  event.preventDefault();
  navigateSite(url.href);
}
