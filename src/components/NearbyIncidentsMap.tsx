import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Leaflet's default marker icons reference image paths that don't survive
// bundling; point them at the CDN copies that ship with the same version.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const severityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive/20 text-destructive font-bold",
};

type NearbyIncident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
  distance_km: number;
};

const RADIUS_KM = 20;

export default function NearbyIncidentsMap() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [incidents, setIncidents] = useState<NearbyIncident[]>([]);
  const [status, setStatus] = useState<"locating" | "loading" | "ready" | "denied" | "error">("locating");

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setStatus("loading");
    api
      .get<NearbyIncident[]>(
        `/api/incidents/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=${RADIUS_KM}`
      )
      .then((data) => {
        setIncidents(data || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [coords]);

  if (status === "locating" || status === "loading") {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>{status === "locating" ? "Getting your location..." : "Finding nearby incidents..."}</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>Location access was denied, so nearby incidents can't be shown.</p>
        <p className="text-sm mt-1">Enable location permission for this site and reload to see the map.</p>
      </div>
    );
  }

  if (status === "error" || !coords) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>Couldn't load nearby incidents right now.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Incidents near you
          </h3>
          <p className="text-sm text-muted-foreground">
            {incidents.length} active incident{incidents.length === 1 ? "" : "s"} within {RADIUS_KM} km
          </p>
        </div>
      </div>
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[coords.lat, coords.lng]}
          radius={RADIUS_KM * 1000}
          pathOptions={{ color: "#22c55e", fillOpacity: 0.05 }}
        />
        <Marker position={[coords.lat, coords.lng]}>
          <Popup>You are here</Popup>
        </Marker>
        {incidents.map((incident) => (
          <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <p className="font-semibold">{incident.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {incident.category.replace("_", " ")} • {incident.distance_km} km away
                </p>
                {incident.address && <p className="text-xs">{incident.address}</p>}
                <button
                  className="text-xs text-primary underline"
                  onClick={() => navigate(`/incident/${incident.id}`)}
                >
                  View details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {incidents.length > 0 && (
        <div className="p-4 border-t border-border/30 flex flex-wrap gap-2">
          {incidents.slice(0, 6).map((incident) => (
            <Badge key={incident.id} variant="outline" className={severityColor[incident.severity]}>
              {incident.title} • {incident.distance_km}km
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
