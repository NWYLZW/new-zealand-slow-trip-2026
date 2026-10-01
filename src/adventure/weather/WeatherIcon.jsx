import { PencilIcon } from "../pencil/PencilIcon";

const cloud = "M9 22h14c7 0 7-10 1-11-2-8-14-8-15 1-7-1-8 10 0 10";
const paths = {
  sun: "M16 9a7 7 0 1 0 0 14 7 7 0 1 0 0-14M16 3v3m0 20v3M3 16h3m20 0h3M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3",
  cloud, fog: `${cloud}M7 26h18M10 29h13`, rain: `${cloud}M10 25l-2 4m10-4-2 4m10-4-2 4`,
  snow: `${cloud}M10 25v5m-2-4 4 3m-4 0 4-3m10-1v5m-2-4 4 3m-4 0 4-3`,
  thunder: `${cloud}M17 18l-4 7h5l-3 6`,
  unknown: `${cloud}M13 13c0-4 7-4 6 0-1 2-3 1-3 4m0 2v1`,
  loading: "M9 5h14M9 27h14M11 5v5l10 12v5M21 5v5L11 22v5M13 10h6M12 25h8",
  error: "M16 5 3 27h26L16 5M16 12v7m0 3v2",
};
export function WeatherIcon({ kind = "unknown" }) {
  return <PencilIcon kind={`weather-${kind}`}><path d={paths[kind] ?? paths.unknown} /></PencilIcon>;
}
