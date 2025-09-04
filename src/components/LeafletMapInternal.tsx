import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Bin {
  id: string;
  bin_id: string;
  location: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface LeafletMapInternalProps {
  bins: Bin[];
  onBinSelect?: (bin: Bin) => void;
  userLocation: UserLocation | null;
  onLocationRequest: () => void;
  locationLoading: boolean;
}

// Custom bin icon
const createBinIcon = (status: string) => {
  const color = status === 'active' ? '#22c55e' : status === 'full' ? '#ef4444' : '#f59e0b';
  return L.divIcon({
    className: 'custom-bin-marker',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// User location icon
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
      background-color: #3b82f6;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      animation: pulse 2s infinite;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Component to handle map centering
function MapController({ userLocation, bins }: { userLocation: UserLocation | null, bins: Bin[] }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && bins.length > 0) {
      // Calculate bounds to include user location and all bins
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude] as [number, number],
        ...bins.map(bin => [bin.latitude, bin.longitude] as [number, number])
      ]);
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15);
    } else if (bins.length > 0) {
      const bounds = L.latLngBounds(bins.map(bin => [bin.latitude, bin.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [userLocation, bins, map]);

  return null;
}

const LeafletMapInternal = ({ bins, onBinSelect, userLocation, onLocationRequest, locationLoading }: LeafletMapInternalProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-eco text-white';
      case 'full':
        return 'bg-destructive text-destructive-foreground';
      case 'maintenance':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'full':
        return '🔴';
      case 'maintenance':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const openDirections = (bin: Bin) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`;
    window.open(url, '_blank');
  };

  // Default center (you can adjust this to your preferred location)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      <MapContainer
        center={userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter}
        zoom={userLocation ? 15 : 12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController userLocation={userLocation} bins={bins} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={createUserIcon()}
          >
            <Popup>
              <div className="text-center">
                <div className="text-sm font-semibold text-primary">Your Location</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Bin markers */}
        {bins.map((bin) => (
          <Marker
            key={bin.id}
            position={[bin.latitude, bin.longitude]}
            icon={createBinIcon(bin.status)}
          >
            <Popup>
              <div className="min-w-48 p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getStatusIcon(bin.status)}</span>
                  <div>
                    <div className="font-semibold text-eco">{bin.bin_id}</div>
                    <div className="text-xs text-muted-foreground">{bin.location}</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <Badge className={getStatusColor(bin.status)}>
                    {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDirections(bin)}
                    className="flex-1 border-eco text-eco hover:bg-eco hover:text-white"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                  {onBinSelect && (
                    <Button
                      size="sm"
                      onClick={() => onBinSelect(bin)}
                      className="flex-1 bg-eco hover:bg-eco-dark"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Select
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Location button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={onLocationRequest}
          disabled={locationLoading}
          className="bg-eco hover:bg-eco-dark shadow-lg"
          size="sm"
        >
          <Crosshair className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card p-2 rounded-lg shadow-lg border">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-eco"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span>Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted"></div>
            <span>Maintenance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeafletMapInternal;