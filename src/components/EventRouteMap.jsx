import { useEffect, useMemo } from "react";
import { Box, Button } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import { latLngBounds } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { mapStopEn, routeSegmentEn } from "../routeI18n";

function toPoint(position) {
  if (Array.isArray(position)) return position;
  return [position.lat, position.lng];
}

function EventMapViewport({ points }) {
  const map = useMap();
  const signature = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      if (points.length === 1) {
        map.setView(points[0], 12, { animate: false });
        return;
      }
      map.fitBounds(latLngBounds(points), {
        animate: false,
        maxZoom: 11,
        padding: [24, 24],
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [map, signature]);

  return null;
}

export function EventRouteMap({ color, googleMapsLabel = "在 Google 地图打开", googleMapsUrl, language = "zh", segments = [], stops = [] }) {
  const routePoints = useMemo(
    () => segments.flatMap((segment) => segment.path.map(toPoint)),
    [segments],
  );
  const locationPoints = useMemo(
    () => stops.map((stop) => toPoint(stop.position)),
    [stops],
  );
  const points = segments.length ? routePoints : locationPoints;

  if (!points.length) return null;

  return (
    <Box className="route-dialog-map" aria-label={language === "en" ? "Map for this event" : "当前事件地图"}>
      <MapContainer
        center={points[0]}
        className="route-dialog-leaflet-map"
        maxZoom={18}
        minZoom={2}
        scrollWheelZoom
        zoom={8}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {segments.map((segment) => (
          <Polyline
            key={segment.id}
            pathOptions={{
              color: segment.color ?? color,
              dashArray: segment.optional || segment.transport !== "road" ? "7 7" : undefined,
              lineCap: "round",
              lineJoin: "round",
              opacity: 0.96,
              weight: 5,
            }}
            positions={segment.path}
          >
            <Tooltip sticky>{segment.date} · {language === "en" ? (routeSegmentEn[segment.label] ?? segment.label) : segment.label}</Tooltip>
          </Polyline>
        ))}
        {segments.flatMap((segment) => segment.path.map((position, index) => (
          <CircleMarker
            center={position}
            key={`${segment.id}-${index}`}
            pathOptions={{
              color: "#ffffff",
              fillColor: segment.color ?? color,
              fillOpacity: segment.optional ? 0.72 : 1,
              weight: 2,
            }}
            radius={5}
          >
            <Tooltip direction="top">{language === "en" ? (routeSegmentEn[segment.label] ?? segment.label) : segment.label}</Tooltip>
          </CircleMarker>
        )))}
        {stops.map((stop) => (
          <CircleMarker
            center={stop.position}
            key={stop.tag}
            pathOptions={{
              color: "#ffffff",
              fillColor: stop.color ?? color,
              fillOpacity: 1,
              weight: 3,
            }}
            radius={8}
          >
            <Tooltip direction="top">
              <strong>{language === "en" ? (mapStopEn[stop.tag]?.[0] ?? stop.name) : stop.name}</strong><br />
              {language === "en" ? (mapStopEn[stop.tag]?.[1] ?? stop.desc) : stop.desc}
            </Tooltip>
          </CircleMarker>
        ))}
        <EventMapViewport points={points} />
      </MapContainer>
      {googleMapsUrl && (
        <Button
          className="route-dialog-map-action"
          component="a"
          href={googleMapsUrl}
          startIcon={<MapIcon />}
          target="_blank"
          rel="noreferrer"
          size="small"
          variant="contained"
        >
          {googleMapsLabel}
        </Button>
      )}
    </Box>
  );
}
