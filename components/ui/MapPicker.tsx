"use client";

import { useState, useEffect } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMap, 
  useMapEvents 
} from "react-leaflet";
import { Search, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next.js
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

// Inner component to handle search zooming
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Inner component to handle clicking on map
function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number], 
  setPosition: (pos: [number, number]) => void 
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

export function MapPicker({ initialLat, initialLng, onLocationSelect }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat || -6.2088, initialLng || 106.8456]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync position with props if they change externally
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newPos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setPosition(newPos);
        onLocationSelect(newPos[0], newPos[1], data[0].display_name);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Important: we only update the parent when the coordinate actually changes from user interaction
  // to avoid infinite loops with the external state syncing
  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari lokasi atau alamat..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-[#102a43] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Cari"}
        </button>
      </div>

      <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handleMapClick} />
          <MapController center={position} />
        </MapContainer>
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex flex-col">
           <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Koordinat Terpilih</p>
           <p className="text-xs font-mono font-bold text-blue-700">
             {position[0].toFixed(6)}, {position[1].toFixed(6)}
           </p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 italic font-medium">
        * Klik pada peta untuk memindahkan pin lokasi secara presisi.
      </p>
    </div>
  );
}
