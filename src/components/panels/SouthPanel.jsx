import { RouteMap } from "../RouteMap";
import { southDays } from "../../tripData";

export function SouthPanel() {
  return <RouteMap mode="south" days={southDays} />;
}
