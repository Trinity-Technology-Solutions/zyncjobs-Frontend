import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

interface LocationRadiusSearchProps {
  onSearch: (params: { latitude: number; longitude: number; radius: number; query?: string }) => void;
}

const LocationRadiusSearch: React.FC<LocationRadiusSearchProps> = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(25);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSearch({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius,
          query
        });
        setLocation('Current Location');
        setLoading(false);
      },
      () => {
        alert('Unable to get your location');
        setLoading(false);
      }
    );
  };

  const searchByAddress = async () => {
    if (!location.trim()) return;
    
    setLoading(true);
    try {
      // Use a geocoding service (example with OpenStreetMap Nominatim)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
      const data = await response.json();
      
      if (data.length > 0) {
        onSearch({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          radius,
          query
        });
      } else {
        alert('Location not found');
      }
    } catch (error) {
      alert('Error finding location');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-500" />
        Location-based Search
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            placeholder="Job title, keywords"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <input
            type="text"
            placeholder="City, address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
            <option value={100}>100 miles</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={searchByAddress}
            disabled={loading || !location.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </button>
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationRadiusSearch;