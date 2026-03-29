import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Earthquake, Coordinates, Disaster } from '../types';

// Fix for default marker icons in React/Vite
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for earthquakes based on magnitude
const getQuakeIcon = (mag: number) => {
  const color = mag >= 5 ? '#ef4444' : mag >= 3 ? '#f59e0b' : '#3b82f6';
  const size = Math.max(10, mag * 5);
  
  return L.divIcon({
    className: 'custom-quake-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const RecenterMap = ({ location }: { location: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([location.lat, location.lng], 8);
  }, [location, map]);
  return null;
};

interface MapProps {
  userLocation: Coordinates | null;
  disasters: Disaster[];
  theme: 'light' | 'dark' | 'system';
}

const Map: React.FC<MapProps> = ({ userLocation, disasters, theme }) => {
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [-6.2088, 106.8456]; // Default to Jakarta
  const isDarkMode = window.document.documentElement.classList.contains('dark');

  return (
    <div className="h-full w-full overflow-hidden border-none">
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDarkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="font-semibold">Lokasi Anda</div>
            </Popup>
          </Marker>
        )}

        {disasters.filter(d => d.coordinates).map((disaster) => (
          <Marker 
            key={disaster.id} 
            position={[disaster.coordinates!.lat, disaster.coordinates!.lng]}
            icon={getQuakeIcon(disaster.type === 'earthquake' ? 5 : 3)} // Placeholder logic for icon
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-slate-900">{disaster.title}</h3>
                <p className="text-sm text-slate-600">{disaster.location}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(disaster.time).toLocaleString('id-ID')}
                </p>
                {disaster.url && (
                  <a 
                    href={disaster.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2 block"
                  >
                    Detail Selengkapnya
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && <RecenterMap location={userLocation} />}
      </MapContainer>
    </div>
  );
};

export default Map;
