import { GoogleMapIcon } from "./SketchIcons";

export function AdventureGoogleMapLink({ href, ariaLabel, iconAfter = false, className = "", children }) {
  if (!href) return children;
  return <a className={`trip-google-map-link${iconAfter ? " trip-google-map-link--icon-after" : ""} ${className}`.trim()}
    href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
    {!iconAfter && <GoogleMapIcon />}
    {children}
    {iconAfter && <GoogleMapIcon />}
  </a>;
}
