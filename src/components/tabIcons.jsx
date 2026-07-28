import HotelIcon from "@mui/icons-material/Hotel";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RouteIcon from "@mui/icons-material/Route";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TerrainIcon from "@mui/icons-material/Terrain";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

const iconMap = {
  hotel: HotelIcon,
  car: DirectionsCarIcon,
  notes: ListAltIcon,
  route: RouteIcon,
  shopping: ShoppingBagIcon,
  terrain: TerrainIcon,
};

export function TabIcon({ name, className }) {
  const Icon = iconMap[name] ?? RouteIcon;
  return <Icon className={className} fontSize="small" />;
}

const englishLabels = {
  overview: { label: "Trip overview", short: "Overview" },
  south: { label: "South Island", short: "South" },
  north: { label: "North Island", short: "North" },
  car: { label: "Car rental plan", short: "Car" },
  booking: { label: "Flights & hotels", short: "Bookings" },
  notes: { label: "Travel notes", short: "Notes" },
};

export function tabLabel(tab, variant = "label", language = "zh") {
  const translated = englishLabels[tab.value];
  const text = language === "en" && translated
    ? translated[variant === "short" ? "short" : "label"]
    : (variant === "short" ? tab.short : tab.label);
  return (
    <span className="tab-label">
      <TabIcon name={tab.icon} />
      <span>{text}</span>
    </span>
  );
}
