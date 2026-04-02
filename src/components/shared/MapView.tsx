interface MapViewProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  height?: string;
}

export default function MapView({ 
  latitude = -1.9403, 
  longitude = 29.8739,
  address,
  height = '300px'
}: MapViewProps) {
  // In production, integrate with Mapbox or Google Maps
  // For now, display a placeholder
  return (
    <div 
      className="w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center p-4">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-gray-500 text-sm">
          {address || 'Kigali, Rwanda'}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Lat: {latitude}, Lng: {longitude}
        </p>
      </div>
    </div>
  );
}
