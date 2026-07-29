import { RouteMap } from "../RouteMap";
import { northDays } from "../../tripData";

export function NorthPanel({ onDetailChange }) {
  return <RouteMap mode="north" days={northDays} onDetailChange={onDetailChange} />;
}
