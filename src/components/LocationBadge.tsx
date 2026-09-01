import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import type { JournalLocation } from '../types';

interface LocationBadgeProps {
  location?: JournalLocation;
  interactive?: boolean;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({ location, interactive = true }) => {
  if (!location) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 text-xs font-medium">
      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      <span className="truncate max-w-[180px] sm:max-w-xs">
        {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
      </span>
      {interactive && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-stone-400 hover:text-stone-700 transition-colors ml-0.5"
          title="Open in Google Maps"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
