import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Minus, MapPin, Navigation, ExternalLink, RotateCcw } from 'lucide-react';
import type { JournalLocation } from '../types';

interface InteractiveTileMapProps {
  location: JournalLocation | undefined;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

// Convert Lat/Lng to pixel coordinate in Mercator projection for a given zoom level
function latLngToPoint(lat: number, lng: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sinY = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinY) / (1 - sinY)) / (4 * Math.PI)) * scale;
  return { x, y };
}

// Convert pixel coordinate back to Lat/Lng
function pointToLatLng(x: number, y: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  };
}

export const InteractiveTileMap: React.FC<InteractiveTileMapProps> = ({
  location,
  onLocationSelect,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Center coordinates of viewport
  const [centerLat, setCenterLat] = useState<number>(location?.lat ?? 37.7749);
  const [centerLng, setCenterLng] = useState<number>(location?.lng ?? -122.4194);
  const [zoom, setZoom] = useState<number>(13);
  
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 256,
  });

  // Pan dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartCenterRef = useRef<{ lat: number; lng: number }>({ lat: centerLat, lng: centerLng });
  const hasMovedRef = useRef<boolean>(false);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setDimensions({
            width: Math.max(200, entry.contentRect.width),
            height: Math.max(150, entry.contentRect.height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update center when location changes externally
  useEffect(() => {
    if (location) {
      setCenterLat(location.lat);
      setCenterLng(location.lng);
    }
  }, [location?.lat, location?.lng]);

  const handleZoomIn = () => setZoom((z) => Math.min(18, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(3, z - 1));

  const handleResetCenter = () => {
    if (location) {
      setCenterLat(location.lat);
      setCenterLng(location.lng);
      setZoom(13);
    } else {
      setCenterLat(37.7749);
      setCenterLng(-122.4194);
      setZoom(13);
    }
  };

  // Mouse & Touch events for smooth panning and clicking
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartCenterRef.current = { lat: centerLat, lng: centerLng };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    const startPoint = latLngToPoint(
      dragStartCenterRef.current.lat,
      dragStartCenterRef.current.lng,
      zoom
    );
    const newPoint = {
      x: startPoint.x - dx,
      y: startPoint.y - dy,
    };
    const newLatLng = pointToLatLng(newPoint.x, newPoint.y, zoom);
    setCenterLat(newLatLng.lat);
    setCenterLng(newLatLng.lng);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // If it was a click (not a drag), place the pin at clicked location
    if (!hasMovedRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const centerPoint = latLngToPoint(centerLat, centerLng, zoom);
      const clickedPointX = centerPoint.x - dimensions.width / 2 + clickX;
      const clickedPointY = centerPoint.y - dimensions.height / 2 + clickY;

      const clickedLatLng = pointToLatLng(clickedPointX, clickedPointY, zoom);
      onLocationSelect(clickedLatLng.lat, clickedLatLng.lng);
    }
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStartCenterRef.current = { lat: centerLat, lng: centerLng };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartPosRef.current.x;
    const dy = e.touches[0].clientY - dragStartPosRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    const startPoint = latLngToPoint(
      dragStartCenterRef.current.lat,
      dragStartCenterRef.current.lng,
      zoom
    );
    const newPoint = {
      x: startPoint.x - dx,
      y: startPoint.y - dy,
    };
    const newLatLng = pointToLatLng(newPoint.x, newPoint.y, zoom);
    setCenterLat(newLatLng.lat);
    setCenterLng(newLatLng.lng);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (!hasMovedRef.current && containerRef.current && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const clickY = touch.clientY - rect.top;

      const centerPoint = latLngToPoint(centerLat, centerLng, zoom);
      const clickedPointX = centerPoint.x - dimensions.width / 2 + clickX;
      const clickedPointY = centerPoint.y - dimensions.height / 2 + clickY;

      const clickedLatLng = pointToLatLng(clickedPointX, clickedPointY, zoom);
      onLocationSelect(clickedLatLng.lat, clickedLatLng.lng);
    }
  };

  // Calculate visible tiles
  const centerPoint = latLngToPoint(centerLat, centerLng, zoom);
  const scale = 256 * Math.pow(2, zoom);
  const numTiles = Math.pow(2, zoom);

  const minX = Math.floor((centerPoint.x - dimensions.width / 2) / 256);
  const maxX = Math.floor((centerPoint.x + dimensions.width / 2) / 256);
  const minY = Math.floor((centerPoint.y - dimensions.height / 2) / 256);
  const maxY = Math.floor((centerPoint.y + dimensions.height / 2) / 256);

  const tiles = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // Wrap X around globe
      const wrappedX = ((x % numTiles) + numTiles) % numTiles;
      if (y >= 0 && y < numTiles) {
        const tileLeft = x * 256 - (centerPoint.x - dimensions.width / 2);
        const tileTop = y * 256 - (centerPoint.y - dimensions.height / 2);
        
        // Use clean CartoDB Voyager raster tiles for clear, high-contrast map rendering
        const subdomains = ['a', 'b', 'c', 'd'];
        const s = subdomains[(wrappedX + y) % subdomains.length];
        const tileUrl = `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrappedX}/${y}.png`;
        
        tiles.push({
          key: `${zoom}-${wrappedX}-${y}-${x}`,
          url: tileUrl,
          left: tileLeft,
          top: tileTop,
        });
      }
    }
  }

  // Calculate marker position on screen
  let markerScreenPos: { x: number; y: number } | null = null;
  if (location) {
    const markerPoint = latLngToPoint(location.lat, location.lng, zoom);
    markerScreenPos = {
      x: markerPoint.x - centerPoint.x + dimensions.width / 2,
      y: markerPoint.y - centerPoint.y + dimensions.height / 2,
    };
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative select-none overflow-hidden bg-stone-200 cursor-grab active:cursor-grabbing ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Render map tiles */}
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.url}
          alt=""
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute w-[256px] h-[256px] pointer-events-none transition-opacity duration-150"
          style={{
            transform: `translate(${tile.left}px, ${tile.top}px)`,
          }}
        />
      ))}

      {/* Subtle map vignette overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-inner border border-stone-300/60 rounded-xl" />

      {/* Render Location Pin Marker */}
      {markerScreenPos && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-full transition-transform duration-75 z-20"
          style={{
            left: `${markerScreenPos.x}px`,
            top: `${markerScreenPos.y}px`,
          }}
        >
          <div className="relative flex flex-col items-center group">
            {/* Custom Modern Marker Pin */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-stone-950 text-amber-400 border-2 border-stone-800 shadow-md transform hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4 fill-amber-400" />
            </div>
            {/* Pin Pointer Arrow */}
            <div className="w-2 h-2 bg-stone-950 rotate-45 -mt-1 shadow-xs" />
            
            {/* Tooltip Label */}
            {location && location.name && (
              <div className="mt-1 px-2 py-0.5 rounded bg-stone-900/90 text-stone-100 text-[10px] font-medium whitespace-nowrap shadow-sm backdrop-blur-xs">
                {location.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Interactive Control Buttons */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          title="Zoom In"
          className="w-7 h-7 bg-white/95 hover:bg-white text-stone-700 hover:text-stone-950 rounded-lg shadow-sm border border-stone-300/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          title="Zoom Out"
          className="w-7 h-7 bg-white/95 hover:bg-white text-stone-700 hover:text-stone-950 rounded-lg shadow-sm border border-stone-300/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleResetCenter();
          }}
          title="Recenter"
          className="w-7 h-7 bg-white/95 hover:bg-white text-stone-700 hover:text-stone-950 rounded-lg shadow-sm border border-stone-300/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom info badge */}
      <div className="absolute bottom-2 left-2 z-30">
        <div className="bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] text-stone-600 border border-stone-300/70 shadow-2xs flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3 h-3 text-amber-600" />
          <span>Click anywhere to place pin • Drag to pan</span>
        </div>
      </div>

      {/* Attribution & Open In Maps Link */}
      <div className="absolute bottom-1 right-2 z-30 flex items-center gap-1">
        {location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-stone-600 bg-white/90 hover:bg-white hover:text-stone-900 px-2 py-0.5 rounded border border-stone-300 flex items-center gap-1 transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
};
