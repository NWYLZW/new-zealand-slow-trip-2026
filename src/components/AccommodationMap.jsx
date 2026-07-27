import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import NearMeIcon from "@mui/icons-material/NearMe";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./AccommodationMap.css";

function FocusSelectedHotel({ position }) {
  const map = useMap();
  const signature = position.join(",");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      map.setView(position, 15, { animate: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [map, signature]);

  return null;
}

export function AccommodationMap({ hotels, selectedHotel, isEnglish }) {
  const selected = hotels.find((hotel) => hotel.hotel === selectedHotel) ?? hotels[0];
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.mapQuery)}&travelmode=driving&dir_action=navigate`;

  return (
    <Box className="accommodation-map-wrap">
      <MapContainer
        aria-label={isEnglish ? "Accommodation locations map" : "住宿地点地图"}
        center={selected.position}
        className="accommodation-map"
        scrollWheelZoom
        zoom={15}
        zoomControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hotels.map((hotel) => {
          const isSelected = hotel.hotel === selected.hotel;
          return (
            <CircleMarker
              center={hotel.position}
              eventHandlers={{ click: () => hotel.onSelect(hotel.hotel) }}
              key={hotel.hotel}
              pathOptions={{
                color: isSelected ? "#123f36" : "#2f7467",
                fillColor: isSelected ? "#f28c5b" : "#ffffff",
                fillOpacity: 1,
                weight: isSelected ? 5 : 3,
              }}
              radius={isSelected ? 11 : 7}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent={isSelected}>
                {hotel.hotel}
              </Tooltip>
            </CircleMarker>
          );
        })}
        <FocusSelectedHotel position={selected.position} />
      </MapContainer>
      <Button
        className="accommodation-map-navigation"
        component="a"
        href={navigationUrl}
        rel="noreferrer"
        startIcon={<NearMeIcon />}
        target="_blank"
        variant="contained"
      >
        {isEnglish ? "Navigate from my location" : "从当前位置导航"}
      </Button>
      <Stack className="accommodation-map-selected" spacing={0.2}>
        <Typography variant="caption">{isEnglish ? "Selected stay" : "当前住宿"}</Typography>
        <Typography>{isEnglish ? selected.placeEn : selected.place}</Typography>
        <Typography variant="caption">{selected.hotel}</Typography>
      </Stack>
    </Box>
  );
}
