import React, { useState, useEffect, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  MapMouseEvent 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Navigation, 
  Search, 
  X, 
  Compass, 
  Check, 
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  Key,
  Globe
} from 'lucide-react';
import type { JournalLocation } from '../types';
import { InteractiveTileMap } from './InteractiveTileMap';

interface LocationPickerProps {
  location: JournalLocation | undefined;
  onChange: (location: JournalLocation | undefined) => void;
}

const PRESET_PLACES = [
  { name: 'Home Sanctuary', lat: 37.7749, lng: -122.4194, category: 'Sanctuary', icon: '🏡' },
  { name: 'Quiet Cafe', lat: 37.7833, lng: -122.4167, category: 'Focus', icon: '☕' },
  { name: 'Redwood Trail / Nature', lat: 37.8970, lng: -122.5811, category: 'Nature', icon: '🌲' },
  { name: 'City Park & Lake', lat: 37.7690, lng: -122.4467, category: 'Mindfulness', icon: '🌿' },
  { name: 'Library & Reading Room', lat: 37.7793, lng: -122.4160, category: 'Study', icon: '📚' },
  { name: 'Mountaintop Vista', lat: 37.9235, lng: -122.5965, category: 'Perspective', icon: '⛰️' },
  { name: 'Ocean Beach Lookout', lat: 37.7594, lng: -122.5107, category: 'Serenity', icon: '🌊' },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({ location, onChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(location));
  const [placeName, setPlaceName] = useState<string>(location?.name || '');
  const [placeAddress, setPlaceAddress] = useState<string>(location?.address || '');
  const [placeNotes, setPlaceNotes] = useState<string>(location?.notes || '');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Search input for coordinates or places
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Read Maps API key from environment
  const rawEnvApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'interactive' | 'google'>('interactive');
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);

  const effectiveApiKey = customApiKey.trim() || rawEnvApiKey.trim();
  
  // A valid Google Maps API Key starts with 'AIza' and has sufficient length
  const hasGoogleKeyConfigured = 
    Boolean(effectiveApiKey) && 
    effectiveApiKey.startsWith('AIza') && 
    effectiveApiKey.length > 20 && 
    !effectiveApiKey.includes('MY_') && 
    !effectiveApiKey.includes('YOUR_');

  // Intercept Google Maps errors (auth failure, unactivated API, quota)
  useEffect(() => {
    const originalAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] Authentication or activation check failed. Switching to interactive map.');
      setGoogleMapsError('Google Maps API key is unauthorized or Maps JavaScript API is not activated.');
      setMapMode('interactive');
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ApiNotActivatedMapError') ||
        event.message?.includes('InvalidKeyMapError') ||
        event.message?.includes('google.maps')
      ) {
        console.warn('[Google Maps] Script error caught:', event.message);
        setGoogleMapsError('Maps JavaScript API is not activated in your Google Cloud Console for this key.');
        setMapMode('interactive');
      }
    };

    window.addEventListener('error', handleGlobalError);

    return () => {
      (window as any).gm_authFailure = originalAuthFailure;
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Default coordinate center (San Francisco fallback or current location)
  const defaultCenter = location 
    ? { lat: location.lat, lng: location.lng } 
    : { lat: 37.7749, lng: -122.4194 };

  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Sync internal form fields when external location prop changes
  useEffect(() => {
    if (location) {
      setPlaceName(location.name || '');
      setPlaceAddress(location.address || '');
      setPlaceNotes(location.notes || '');
      setMapCenter({ lat: location.lat, lng: location.lng });
    }
  }, [location]);

  // Handle location update from map click
  const handleSelectCoordinates = useCallback((lat: number, lng: number, nameHint?: string, addressHint?: string) => {
    const finalName = nameHint || placeName || 'Reflection Spot';
    const finalAddress = addressHint || placeAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    setPlaceName(finalName);
    setPlaceAddress(finalAddress);
    setMapCenter({ lat, lng });

    const updated: JournalLocation = {
      lat,
      lng,
      name: finalName,
      address: finalAddress,
      notes: placeNotes,
    };
    onChange(updated);
  }, [placeName, placeAddress, placeNotes, onChange]);

  // Handle Google Maps click event (when Google Maps API key is active)
  const handleGoogleMapClick = useCallback((e: MapMouseEvent) => {
    if (e.detail.latLng) {
      handleSelectCoordinates(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  }, [handleSelectCoordinates]);

  // Use browser HTML5 Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleSelectCoordinates(
          lat, 
          lng, 
          placeName || 'Current Location', 
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        );
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation notice:', err.message);
        setLocError('Location request timed out or was denied. You can click anywhere on the map to pin your location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search by coordinate or query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query is in lat, lng format
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        handleSelectCoordinates(lat, lng, `Coordinates (${lat.toFixed(2)}, ${lng.toFixed(2)})`, searchQuery);
        setSearchQuery('');
        return;
      }
    }

    // Match preset places
    const matched = PRESET_PLACES.find((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      handleSelectPreset(matched);
      setSearchQuery('');
    } else {
      // Default center with label
      handleSelectCoordinates(mapCenter.lat, mapCenter.lng, searchQuery, `Place tagged: ${searchQuery}`);
      setSearchQuery('');
    }
  };

  // Update place name or metadata
  const handleMetadataUpdate = (nameVal: string, addressVal: string, notesVal: string) => {
    setPlaceName(nameVal);
    setPlaceAddress(addressVal);
    setPlaceNotes(notesVal);

    if (location) {
      onChange({
        ...location,
        name: nameVal,
        address: addressVal,
        notes: notesVal,
      });
    }
  };

  // Quick Preset Selection
  const handleSelectPreset = (preset: typeof PRESET_PLACES[0]) => {
    handleSelectCoordinates(
      preset.lat,
      preset.lng,
      preset.name,
      `${preset.category} • Mindful Sanctuary`
    );
  };

  // Remove pinned location
  const handleClearLocation = () => {
    onChange(undefined);
    setPlaceName('');
    setPlaceAddress('');
    setPlaceNotes('');
    setIsOpen(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 transition-all shadow-2xs">
      {/* Header Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-200/80 text-stone-700 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-stone-800" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-900 block">
              Location-Aware Journaling
            </span>
            <span className="text-[11px] text-stone-500">
              {location 
                ? `Pinned: ${location.name || 'Custom Coordinates'} (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})`
                : 'Attach a physical setting or mindful place to this reflection'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {location ? (
            <button
              type="button"
              id="remove-location-btn"
              onClick={handleClearLocation}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          ) : (
            <button
              type="button"
              id="toggle-location-picker-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 px-3 py-1 rounded-lg border border-stone-300 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              <span>{isOpen ? 'Close Map' : 'Pin Location'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Location Controls & Map */}
      {(isOpen || location) && (
        <div className="mt-4 pt-4 border-t border-stone-200 space-y-3.5">
          
          {/* Action Row: Current Location, Search & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="current-location-btn"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs bg-white text-stone-800 hover:bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-xl font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 text-amber-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
              </button>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search place or lat,lng..."
                  className="w-40 sm:w-48 pl-7 pr-2 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5" />
              </form>
            </div>

            {/* Quick Inspiration Presets */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
              <span className="text-[11px] text-stone-400 font-medium mr-1 shrink-0">Presets:</span>
              {PRESET_PLACES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`preset-place-${idx}`}
                  onClick={() => handleSelectPreset(p)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] transition-colors cursor-pointer shrink-0"
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {locError && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
              {locError}
            </p>
          )}

          {/* Error Banner if Google Maps API isn't activated */}
          {googleMapsError && (
            <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">{googleMapsError}</span>
                  <span className="text-amber-800">
                    To use Google Maps vector tiles, enable "Maps JavaScript API" in Google Cloud Console. The interactive zero-setup map is currently active.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleMapsError(null)}
                className="text-amber-700 hover:text-amber-900 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive Map Container */}
          <div className="h-60 sm:h-72 w-full rounded-xl overflow-hidden border border-stone-300 relative shadow-inner bg-stone-100">
            {mapMode === 'google' && hasGoogleKeyConfigured ? (
              <APIProvider 
                apiKey={effectiveApiKey}
                onError={(error) => {
                  console.warn('[Google Maps APIProvider Error]', error);
                  setGoogleMapsError('Maps JavaScript API is not activated for this key in Google Cloud Console.');
                  setMapMode('interactive');
                }}
              >
                <Map
                  id="journal-google-map"
                  mapId="DEMO_MAP_ID"
                  defaultCenter={defaultCenter}
                  center={mapCenter}
                  defaultZoom={13}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  onClick={handleGoogleMapClick}
                  style={{ width: '100%', height: '100%' }}
                >
                  {location && (
                    <AdvancedMarker position={{ lat: location.lat, lng: location.lng }}>
                      <Pin
                        background="#1c1917"
                        glyphColor="#f59e0b"
                        borderColor="#44403c"
                        scale={1.1}
                      />
                    </AdvancedMarker>
                  )}
                </Map>
              </APIProvider>
            ) : (
              /* High-fidelity interactive tile map (pan, zoom, click-to-pin, presets) */
              <InteractiveTileMap
                location={location}
                onLocationSelect={(lat, lng) => handleSelectCoordinates(lat, lng)}
                className="w-full h-full"
              />
            )}
          </div>

          {/* Location Metadata Inputs */}
          {location && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Place Name / Mindful Setting
                </label>
                <input
                  id="place-name-input"
                  type="text"
                  value={placeName}
                  onChange={(e) => handleMetadataUpdate(e.target.value, placeAddress, placeNotes)}
                  placeholder="e.g., Redwood Grove Trail, Quiet Coffee Shop"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Address / Setting Details
                </label>
                <input
                  id="place-address-input"
                  type="text"
                  value={placeAddress}
                  onChange={(e) => handleMetadataUpdate(placeName, e.target.value, placeNotes)}
                  placeholder="e.g., San Francisco, CA • Under the shaded pines"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          )}

          {/* Map provider status and configuration */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200/80">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {mapMode === 'google' && hasGoogleKeyConfigured
                  ? 'Active: Google Maps Platform vector map' 
                  : 'Active: Interactive zero-setup map'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasGoogleKeyConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    setGoogleMapsError(null);
                    setMapMode(mapMode === 'google' ? 'interactive' : 'google');
                  }}
                  className="text-stone-600 hover:text-stone-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3 text-stone-400" />
                  <span>{mapMode === 'google' ? 'Switch to Interactive Map' : 'Try Google Maps API'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                className="text-stone-600 hover:text-stone-900 underline flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3 h-3 text-stone-400" />
                <span>{showKeyConfig ? 'Hide Settings' : 'Google Cloud Key Settings'}</span>
              </button>
            </div>
          </div>

          {/* Optional Google Maps API Key Input Drawer */}
          {showKeyConfig && (
            <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Custom Google Maps Platform Key</span>
                <a
                  href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Enable Maps JavaScript API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-stone-500">
                To use Google Maps Vector tiles, ensure "Maps JavaScript API" is enabled in your Google Cloud Console for this key:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => {
                    setCustomApiKey(e.target.value);
                    setGoogleMapsError(null);
                  }}
                  placeholder="AIzaSy..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 font-mono"
                />
                {customApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomApiKey('');
                      setGoogleMapsError(null);
                      setMapMode('interactive');
                    }}
                    className="px-2.5 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-200"
                  >
                    Reset
                  </button>
                )}
                {hasGoogleKeyConfigured && mapMode !== 'google' && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleMapsError(null);
                      setMapMode('google');
                    }}
                    className="px-2.5 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Test Key
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
