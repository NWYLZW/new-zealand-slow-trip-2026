import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Chip, Grid2 as Grid, Paper, Stack, Typography } from "@mui/material";
import { GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { mapStops } from "../tripData";

const routeQueries = [
  "Shenzhen",
  "Kuala Lumpur International Airport",
  "Auckland New Zealand",
  "Queenstown New Zealand",
  "Milford Sound New Zealand",
  "Wanaka New Zealand",
  "Aoraki Mount Cook National Park",
  "Christchurch New Zealand",
  "Auckland New Zealand",
  "Hobbiton Movie Set",
  "Rotorua New Zealand",
  "Auckland Airport",
];

const googleRoutePath = routeQueries.map(encodeURIComponent).join("/");
const googleMapsRouteUrl = `https://www.google.com/maps/dir/${googleRoutePath}`;
const googleMapsPreviewUrl = `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(routeQueries.join(" to "))}`;
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapCenter = { lat: -19.2, lng: 151.2 };
const stopByTag = new Map(mapStops.map((stop) => [stop.tag, stop]));

const toLatLng = (tag) => {
  const stop = stopByTag.get(tag);
  return { lat: stop.position[0], lng: stop.position[1] };
};

const flightPath = ["SZX", "KUL", "AKL", "ZQN"].map(toLatLng);
const southRoadPath = ["ZQN", "MFN", "ZQN", "WKA", "AOR", "CHC"].map(toLatLng);
const returnFlightPath = ["CHC", "AKL"].map(toLatLng);
const northRoadPath = ["AKL", "HBT", "ROT", "AKL"].map(toLatLng);

const mapOptions = {
  disableDefaultUI: false,
  clickableIcons: true,
  fullscreenControl: true,
  mapTypeControl: false,
  streetViewControl: false,
};

function GoogleRouteMap() {
  const [hoveredTag, setHoveredTag] = useState(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: "nz-trip-google-maps",
  });
  const dashedLineIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;

    return [{
      icon: {
        path: "M 0,-1 0,1",
        strokeOpacity: 1,
        scale: 3,
      },
      offset: "0",
      repeat: "18px",
    }];
  }, [isLoaded]);
  const hoveredStop = hoveredTag ? stopByTag.get(hoveredTag) : null;

  if (loadError) {
    return (
      <Box className="map-placeholder">
        <Typography fontWeight={900}>Google Maps SDK 加载失败</Typography>
        <Typography color="text.secondary">请检查 API key、网络或 Google Maps JavaScript API 是否已启用。</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box className="map-placeholder">
        <Typography color="text.secondary">Google Maps 加载中…</Typography>
      </Box>
    );
  }

  return (
    <GoogleMap mapContainerClassName="google-route-map" center={mapCenter} zoom={3} options={mapOptions}>
      <PolylineF
        path={flightPath}
        options={{
          strokeColor: "#347e90",
          strokeOpacity: 0,
          strokeWeight: 3,
          icons: dashedLineIcon,
        }}
      />
      <PolylineF
        path={returnFlightPath}
        options={{
          strokeColor: "#347e90",
          strokeOpacity: 0,
          strokeWeight: 3,
          icons: dashedLineIcon,
        }}
      />
      <PolylineF
        path={southRoadPath}
        options={{
          strokeColor: "#df7659",
          strokeOpacity: 0.85,
          strokeWeight: 4,
        }}
      />
      <PolylineF
        path={northRoadPath}
        options={{
          strokeColor: "#347e90",
          strokeOpacity: 0.85,
          strokeWeight: 4,
        }}
      />
      {mapStops.map((stop, index) => (
        <MarkerF
          key={stop.tag}
          position={{ lat: stop.position[0], lng: stop.position[1] }}
          label={{ text: String(index + 1), color: "#ffffff", fontWeight: "900" }}
          title={`${stop.tag} · ${stop.name}`}
          onMouseOver={() => setHoveredTag(stop.tag)}
          onMouseOut={() => setHoveredTag(null)}
        />
      ))}
      {hoveredStop && (
        <InfoWindowF
          position={{ lat: hoveredStop.position[0], lng: hoveredStop.position[1] }}
          onCloseClick={() => setHoveredTag(null)}
        >
          <Box className="map-info-window">
            <Typography fontWeight={900}>{hoveredStop.name}</Typography>
            <Typography variant="caption">{hoveredStop.tag} · {hoveredStop.date}</Typography>
            <Typography variant="body2">{hoveredStop.desc}</Typography>
          </Box>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

export function RouteMap() {
  return (
    <Card className="map-card">
      <CardContent>
        <Box className="map-frame map-frame-full">
          {googleMapsApiKey ? (
            <GoogleRouteMap />
          ) : (
            <iframe
              className="google-route-preview"
              title="新西兰旅行 Google Maps 路线预览"
              src={googleMapsPreviewUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </Box>
        <Stack direction="row" className="map-actions">
          <Button variant="contained" component="a" href={googleMapsRouteUrl} target="_blank" rel="noreferrer">
            在 Google 地图打开完整路线
          </Button>
        </Stack>
        <Grid container spacing={1.2} className="map-stop-grid">
          {mapStops.map((stop) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stop.tag}>
              <Paper className="map-stop" elevation={0} style={{ "--stop-color": stop.color }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={900}>{stop.name}</Typography>
                  <Chip size="small" label={stop.tag} className="map-stop-tag" />
                </Stack>
                <Typography variant="caption" color="text.secondary">{stop.date}</Typography>
                <Typography variant="body2" className="map-stop-desc">{stop.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
