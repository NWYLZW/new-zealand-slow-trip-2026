import { RouteMap } from "../RouteMap";
import { northDays } from "../../tripData";

export function NorthPanel() {
  return <RouteMap mode="north" days={northDays} />;
}
