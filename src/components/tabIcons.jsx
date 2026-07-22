import HotelIcon from "@mui/icons-material/Hotel";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RouteIcon from "@mui/icons-material/Route";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TerrainIcon from "@mui/icons-material/Terrain";

const iconMap = {
  hotel: HotelIcon,
  notes: ListAltIcon,
  route: RouteIcon,
  shopping: ShoppingBagIcon,
  terrain: TerrainIcon,
};

export function TabIcon({ name, className }) {
  const Icon = iconMap[name] ?? RouteIcon;
  return <Icon className={className} fontSize="small" />;
}

export function tabLabel(tab, variant = "label") {
  const text = variant === "short" ? tab.short : tab.label;
  return (
    <span className="tab-label">
      <TabIcon name={tab.icon} />
      <span>{text}</span>
    </span>
  );
}
