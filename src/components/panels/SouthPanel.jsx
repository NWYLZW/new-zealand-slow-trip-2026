import { RouteMap } from "../RouteMap";
import { southDays } from "../../tripData";

export function SouthPanel({ onDetailChange }) {
  return <RouteMap mode="south" days={southDays} onDetailChange={onDetailChange} />;
}
